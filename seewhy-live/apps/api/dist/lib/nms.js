// src/lib/nms.ts
// Node Media Server to handle RTMP/RTMPS ingestion from OBS/Streamlabs
// Handles HLS/DASH packetization for edge delivery
// Serves as the origin for CDN distribution
// @ts-ignore
import NodeMediaServer from 'node-media-server';
import { logger } from './logger.js';
import { prisma } from './prisma.js';
const config = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        allow_origin: '*',
        mediaroot: './media'
    },
    trans: {
        ffmpeg: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
        tasks: [
            {
                app: 'live',
                hls: true,
                hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
                hlsKeep: false,
                dash: true,
                dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
                dashKeep: false
            }
        ]
    }
};
let nms;
export function initRTMPServer() {
    try {
        // Suppress verbose NMS logs
        // @ts-ignore
        const nmsLogger = require('node-media-server/src/node_core_logger');
        nmsLogger.setLogType(1); // 1 = info, 0 = trace
        nms = new NodeMediaServer(config);
        nms.on('prePublish', async (id, StreamPath, args) => {
            logger.info({ id, StreamPath, args }, '[RTMP] prePublish event');
            const streamKey = StreamPath.split('/').pop();
            if (!streamKey) {
                let session = nms.getSession(id);
                session.reject();
                return;
            }
            // Verify Stream Key with DB
            const stream = await prisma.stream.findUnique({
                where: { streamKey: streamKey }
            });
            if (!stream) {
                logger.warn({ streamKey }, '[RTMP] Rejected invalid stream key');
                let session = nms.getSession(id);
                session.reject();
            }
            else {
                logger.info({ creatorId: stream.creatorId }, '[RTMP] Valid stream key authorized');
            }
        });
        nms.on('donePublish', (id, StreamPath, args) => {
            logger.info({ id, StreamPath }, '[RTMP] donePublish event (Stream offline)');
        });
        nms.run();
        logger.info('Node Media Server (RTMP) started on port 1935');
    }
    catch (err) {
        logger.error({ err }, 'Failed to initialize Node Media Server (Ensure ffmpeg is installed)');
    }
}
