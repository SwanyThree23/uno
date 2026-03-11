import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshTokenValue = signRefreshToken({ userId: user.id, email: user.email });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenValue,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    const response = NextResponse.json({
      user: safeUser,
      token: accessToken,
      refreshToken: refreshTokenValue,
    });
    response.cookies.set("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
