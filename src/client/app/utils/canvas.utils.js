/*
https://github.com/mattdesl/canvas-sketch/blob/24f6bb2bbdfdfd72a698a0b8a0962ad843fb7688/lib/save.js
*/

import { changeDpiDataUrl } from "changedpi";
import { get } from "svelte/store";
import { exports } from "../stores";
import { VIDEO_FORMATS } from "../stores/exports";
import { downloadBlob } from "./file.utils";
import WebMRecorder from "../lib/canvas-recorder/WebMRecorder";
import MP4Recorder from "../lib/canvas-recorder/MP4Recorder";
import GIFRecorder from "../lib/canvas-recorder/GIFRecorder";
import FrameRecorder from "../lib/canvas-recorder/FrameRecorder";
import { exportCanvas } from "../lib/canvas-recorder/utils";

export async function saveDataURL(dataURL, options, blob) {
    async function onError(err) {
        if (typeof options.onError === "function") {
            options.onError(err);
        }

        if (!blob) {
            blob = await createBlobFromDataURL(dataURL);
        }

        await downloadBlob(blob, options);
    }

    try {
        const body = {
            dataURL: dataURL.split(',')[1], // remove extension,
            ...options,
        };
        const response = await fetch('/save', {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        });
        const { filepath, error } = await response.json();

        if (response.ok && filepath) {
            console.log(`[fragment] Saved ${filepath}`);
        } else {
            onError(error);
        }
    } catch(error) {
        onError(error);
    }
};

export async function createDataURLFromBlob(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onerror = (err) => {
            reject(err);
        };

        reader.onload = (e) => {
            let base64 = e.target.result.split(',')[1];

            resolve(base64);
        };

        reader.readAsDataURL(blob);
    });
}

export async function saveBlob(blob, options) {
    const dataURL = await createDataURLFromBlob(blob);

    return saveDataURL(dataURL, options, blob);
};

function createBlobFromDataURL(dataURL) {
    return new Promise((resolve) => {
        const splitIndex = dataURL.indexOf(',');

        if (splitIndex === -1) {
            reject(new Error(`createBlobFromDataURL: dataURL doesn't contain extension data.`))
            return;
        }

        const base64 = dataURL.slice(splitIndex + 1);
        const byteString = window.atob(base64);
        const type = dataURL.slice(0, splitIndex);
        const mimeMatch = /data:([^;]+)/.exec(type);
        const mime = (mimeMatch ? mimeMatch[1] : '') || undefined;
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        resolve(new window.Blob([ ab ], { type: mime }));
    });
}

function getFilenameParams() {
    const now = new Date();

    const year = now.toLocaleString('default', { year: 'numeric' });
    const month = now.toLocaleString('default', { month: 'numeric' }).padStart(2, `0`);
    const day = now.toLocaleString('default', { day: 'numeric' });
    const hours = now.toLocaleString('default', { hour: 'numeric' }).split(' ')[0];
    const minutes = now.toLocaleString('default', { minute: 'numeric' }).padStart(2, `0`);
    const seconds = now.toLocaleString('default', { second: 'numeric' }).padStart(2, `0`);

    const timestamp = `${year}.${month}.${day}-${hours}.${minutes}.${seconds}`;

    return {
        year,
        month,
        day,
        hours,
        minutes,
        seconds,
        timestamp,
    };
}

export const defaultFilenamePattern = ({
    filename,
    timestamp,
}) => {
    return `${filename}.${timestamp}`;
};

export async function screenshotCanvas(canvas, {
    filename = "",
    pattern = defaultFilenamePattern,
    params = {},
}) {
    const { imageEncoding, quality, pixelsPerInch } = get(exports);
    let { extension, dataURL } = exportCanvas(canvas, {
        encoding: `image/${imageEncoding}`,
        encodingQuality: quality,
    });

    let patternParams = getFilenameParams();
    let name = pattern({ filename, ...params, ...patternParams });

    if (imageEncoding !== "webp" && pixelsPerInch !== 72) {
        dataURL = changeDpiDataUrl(dataURL, exportParams.pixelsPerInch);
    }
    
    await saveDataURL(dataURL, {
        filename: `${name}${extension}`,
        onError: () => {
            console.error(`[fragment] Error while saving screenshot.`);
        }
    });
}

function recordCanvasWebM(canvas, options) {
    let recorder = new WebMRecorder(canvas, options);
    recorder.start();

    return recorder;
}

function recordCanvasMp4(canvas, options) {
    let recorder = new MP4Recorder(canvas, options);
    recorder.start();

    return recorder;
}

function recordCanvasGIF(canvas, options) {
    let recorder = new GIFRecorder(canvas, options);
    recorder.start();

    return recorder;
}

function recordCanvasFrames(canvas, options) {
    let recorder = new FrameRecorder(canvas, options);
    recorder.start();

    return recorder;
}

export function recordCanvas(canvas, {
    filename = 'output',
    format = 'mp4',
    framerate = 25,
    duration = Infinity,
    quality = 100,
    pattern = defaultFilenamePattern,
    imageEncoding,
    onStart = () => {},
    onTick = () => {},
    onComplete = () => {}
} = {}) {
    let patternParams = getFilenameParams();
    let name = pattern({ filename, ...patternParams });

    function complete(result) {
        if (Array.isArray(result)) {
            const frmt = format === VIDEO_FORMATS.FRAMES ? imageEncoding : format;

            for (let i = 0; i < result.length; i++) {
                const index = `${i}`.padStart(`${result.length}`.length, '0');
                saveBlob(result[i], {
                    filename: `${name}-${index}.${frmt}`,
                    onError: () => {
                        console.log(`[fragment] Error while saving record.`);
                    }
                });
            }
        } else {
            saveBlob(result, {
                filename: `${name}.${format}`,
                onError: () => {
                    console.log(`[fragment] Error while saving record.`);
                }
            });
        }
        onComplete();
    }

    const options = {
        framerate,
        duration,
        quality,
        onStart,
        onTick,
        onComplete: complete,
    };

    let recorder;

    if (format === VIDEO_FORMATS.WEBM) {
        recorder = recordCanvasWebM(canvas, options);
    } else if (format === VIDEO_FORMATS.MP4) {
        recorder = recordCanvasMp4(canvas, options);
    } else if (format === VIDEO_FORMATS.GIF) {
        recorder = recordCanvasGIF(canvas, options);
    } else if (format === VIDEO_FORMATS.FRAMES) {
        recorder = recordCanvasFrames(canvas, {
            ...options,
            imageEncoding,
        });
    }

    if (!recorder) {
        console.error(`Cannot find matching recorder`);
    }

    return recorder;
};
