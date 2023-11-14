async function start() {
    // Load models
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');

    // Get video element and start video
    const video = document.getElementById('videoElement');
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));

    video.addEventListener('play', () => {
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);

        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            detections.forEach(detection => {
                if (detection.expressions && detection.landmarks) {
                    const expressions = detection.expressions;
                    const mouth = detection.landmarks.getMouth();
                    const mouthLeftSide = mouth.slice(0, 7);
                    const mouthRightSide = mouth.slice(7, 14);

                    const avgLeftX = mouthLeftSide.reduce((sum, p) => sum + p.x, 0) / mouthLeftSide.length;
                    const avgRightX = mouthRightSide.reduce((sum, p) => sum + p.x, 0) / mouthRightSide.length;

                    let expressionText = 'Expression: Neutral';
                    const threshold = 10; // Adjust this threshold based on testing

                    if (expressions.happy > 0.8) {
                        expressionText = 'Expression: Smiling';
                    } else if (avgRightX - avgLeftX > threshold) {
                        expressionText = 'Expression: Mouth moving right';
                    } else if (avgLeftX - avgRightX > threshold) {
                        expressionText = 'Expression: Mouth moving left';
                    }

                    document.getElementById('expression').innerText = expressionText;
                }
            });
        }, 100);
    });
}

start();
