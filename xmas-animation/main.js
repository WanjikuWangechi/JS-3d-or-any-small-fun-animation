$(function () {
    var canvas = $("#canvas")[0];
    var ctx = canvas.getContext("2d");
    var WIDTH = 320;
    var HEIGHT = 320;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    clearCanvas();

    var snowParticles = [];
    for (var i = 0; i < WIDTH; i++) {
        snowParticles.push({
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT,
            r: Math.random() * 2 + 1
        });
    }

    // Initialize the comet particle
    var comet = {
        x: 0, // Start at the top-left corner
        y: 0,
        r: 5, // Comet size
        tail: [] // Array to hold tail segments
    };

    function draw() {
        clearCanvas();

        // Draw snow particles
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        snowParticles.forEach((p) => {
            ctx.moveTo(p.x, p.y);
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
        });
        ctx.fill();

        // Draw the comet
        drawComet();

        update();
    }

    function drawComet() {
        // Add the comet's current position to its tail
        comet.tail.push({ x: comet.x, y: comet.y });
        if (comet.tail.length > 30) comet.tail.shift(); // Limit tail length

        // Draw the tail
        comet.tail.forEach((t, index) => {
            let opacity = (index + 1) / comet.tail.length; // Gradually fade the tail
            ctx.fillStyle = `rgba(255, 255, 0, ${opacity})`; // Yellow color
            ctx.beginPath();
            ctx.arc(t.x, t.y, comet.r * (opacity * 0.7 + 0.3), 0, Math.PI * 2, true);
            ctx.fill();
        });

        // Draw the comet head
        ctx.fillStyle = "rgba(255, 255, 0, 1)"; // Bright yellow
        ctx.beginPath();
        ctx.arc(comet.x, comet.y, comet.r, 0, Math.PI * 2, true);
        ctx.fill();
    }

    function update() {
        // Update snow particles
        snowParticles.forEach((p) => {
            p.y += p.r;
            if (p.y > canvas.height) {
                p.x = Math.random() * canvas.width;
                p.y = -10;
            }
        });

        // Update the comet
        comet.x += 4; // Move diagonally to the right
        comet.y += 4; // Move diagonally downward

        // Reset the comet when it exits the screen
        if (comet.x > canvas.width || comet.y > canvas.height) {
            comet.x = 0; // Reset to top-left corner
            comet.y = 0;
            comet.tail = []; // Clear the tail when reset
        }
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    var timer = setInterval(draw, 50);
});
