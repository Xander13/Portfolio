(function () {
    /**
     * Footer Maze Interaction - TRUE GENERATIVE WILD SNAKE
     * Each refresh creates unique, non-repeating path for Blue and White.
     * One single continuous line (no pencil lifting), 100% space filling.
     * Features a growing "arm" with hand SVGs for the Blue line.
     */

    // Global image objects
    const handImage = new Image();
    handImage.src = 'img/Hand.png'; // 400px width source
    const footImage = new Image();
    footImage.src = 'img/Foot.png'; // 400px width source
    const headImage = new Image();
    headImage.src = 'img/Head.png'; // 400px width source

    class GenerativeSnake {
        constructor(canvas, ctx, color, thickness, gridSize, bounds, startCapType = 'none', endCapType = 'none', obstacleType = 'none') {
            this.canvas = canvas;
            this.ctx = ctx;
            this.color = color;
            this.thickness = thickness;
            this.gridSize = gridSize;
            this.bounds = bounds;
            this.startCapType = startCapType;
            this.endCapType = endCapType;
            this.obstacleType = obstacleType;

            this.obstacleCell = null; // {x, y} in maze coords

            this.reset();
        }

        reset() {
            this.path = [];
            this.animateIndex = 0;
            this.segmentProgress = 0;
            this.segmentProgress = 0;
            this.isDone = false;
            this.speed = 4; // Initial slow speed
            this.generatePath();
        }

        generatePath() {
            // 1. Setup Grid Dimensions (Must be even for 2x2 logic)
            let cols = Math.floor((this.bounds.x2 - this.bounds.x1));
            let rows = Math.floor((this.bounds.y2 - this.bounds.y1));

            // Ensure even dimensions for the fine grid so we can divide into 2x2 maze cells
            if (cols % 2 !== 0) cols--;
            if (rows % 2 !== 0) rows--;

            const mazeCols = cols / 2;
            const mazeRows = rows / 2;

            if (mazeCols < 1 || mazeRows < 1) {
                this.points = []; // No path if grid too small
                return;
            }

            // 2. Maze Generation (Spanning Tree) using Recursive Backtracker
            const visited = new Uint8Array(mazeCols * mazeRows); // 0=unvisited, 1=visited
            const stack = [];

            // Walls: true = wall exists (1). false = no wall (0).
            // wallsH[y * mazeCols + x] is the horizontal wall ABOVE cell (x,y)
            // wallsV[y * (mazeCols + 1) + x] is the vertical wall LEFT of cell (x,y)
            const wallsH = new Uint8Array((mazeRows + 1) * mazeCols).fill(1); // (mazeRows+1) rows, mazeCols columns
            const wallsV = new Uint8Array(mazeRows * (mazeCols + 1)).fill(1); // mazeRows rows, (mazeCols+1) columns

            let cx = Math.floor(Math.random() * mazeCols);
            let cy = Math.floor(Math.random() * mazeRows);

            // Setup Obstacle if requested
            // Setup Obstacle if requested
            if (this.obstacleType !== 'none') {
                // Pick a random cell for the obstacle
                // Avoid edges? Maybe not necessary, but safest to be internal or random is fine.
                const ox = Math.floor(Math.random() * mazeCols);
                const oy = Math.floor(Math.random() * mazeRows);
                this.obstacleCell = { x: ox, y: oy };

                // Rotate 45 degrees (random direction)
                this.obstacleRotation = (Math.random() < 0.5 ? -1 : 1) * (Math.PI / 4);

                // Mark obstacle as visited so the maze generator doesn't enter it
                visited[oy * mazeCols + ox] = 1;

                // Ensure start point is not the obstacle
                while (cx === ox && cy === oy) {
                    cx = Math.floor(Math.random() * mazeCols);
                    cy = Math.floor(Math.random() * mazeRows);
                }
            }

            visited[cy * mazeCols + cx] = 1;
            stack.push({ x: cx, y: cy });

            // Adjust visited count since obstacle (1 cell) is pre-visited
            let visitedCount = 1;
            if (this.obstacleCell) visitedCount++;

            const totalCells = mazeCols * mazeRows;

            // Directions: N, S, W, E
            const dirs = [
                { dx: 0, dy: -1, bit: 1 }, // N
                { dx: 0, dy: 1, bit: 2 },  // S
                { dx: -1, dy: 0, bit: 4 }, // W
                { dx: 1, dy: 0, bit: 8 }   // E
            ];

            while (visitedCount < totalCells && stack.length > 0) {
                const current = stack[stack.length - 1];
                const neighbors = [];

                for (let d of dirs) {
                    const nx = current.x + d.dx;
                    const ny = current.y + d.dy;

                    if (nx >= 0 && nx < mazeCols && ny >= 0 && ny < mazeRows) {
                        if (visited[ny * mazeCols + nx] === 0) {
                            neighbors.push({ x: nx, y: ny, d: d });
                        }
                    }
                }

                if (neighbors.length > 0) {
                    const next = neighbors[Math.floor(Math.random() * neighbors.length)];

                    // Break Wall
                    if (next.d.bit === 1) { // North: current connects to (x, y-1)
                        // Wall above current.y, at current.x
                        wallsH[current.y * mazeCols + current.x] = 0;
                    } else if (next.d.bit === 2) { // South: current connects to (x, y+1)
                        // Wall below current.y, at current.x
                        wallsH[(current.y + 1) * mazeCols + current.x] = 0;
                    } else if (next.d.bit === 4) { // West: current connects to (x-1, y)
                        // Wall left of current.x, at current.y
                        wallsV[current.y * (mazeCols + 1) + current.x] = 0;
                    } else if (next.d.bit === 8) { // East: current connects to (x+1, y)
                        // Wall right of current.x, at current.y
                        wallsV[current.y * (mazeCols + 1) + (current.x + 1)] = 0;
                    }

                    visited[next.y * mazeCols + next.x] = 1;
                    visitedCount++;
                    stack.push(next);
                } else {
                    stack.pop();
                }
            }

            // 3. Construct Fine Cycle using Wall Following (2x2 Tile Merging)
            // Every 2x2 fine block (corresponding to a maze cell) starts as a loop: TL->TR->BR->BL->TL
            // 0 1
            // 3 2
            // We merge these loops by removing edges where Maze Walls are missing.

            const fCols = cols; // = mazeCols * 2
            const fRows = rows; // = mazeRows * 2
            const adj = new Int32Array(fCols * fRows * 2).fill(-1); // Each node has up to 2 neighbors

            const setAdj = (u, v) => {
                let idx = u * 2;
                if (adj[idx] !== -1 && adj[idx] !== v) idx++;
                adj[idx] = v;

                idx = v * 2;
                if (adj[idx] !== -1 && adj[idx] !== u) idx++;
                adj[idx] = u;
            };

            const removeAdj = (u, v) => {
                let idx = u * 2;
                if (adj[idx] === v) adj[idx] = -1;
                else if (adj[idx + 1] === v) adj[idx + 1] = -1;

                idx = v * 2;
                if (adj[idx] === u) adj[idx] = -1;
                else if (adj[idx + 1] === u) adj[idx + 1] = -1;
            };

            const getFNode = (x, y) => y * fCols + x;

            // Initial Loops: Create a 2x2 loop for each maze cell
            for (let my = 0; my < mazeRows; my++) {
                for (let mx = 0; mx < mazeCols; mx++) {
                    // Fine coordinates for the top-left of the 2x2 block
                    const x = mx * 2;
                    const y = my * 2;
                    // Nodes of the 2x2 block
                    const tl = getFNode(x, y);
                    const tr = getFNode(x + 1, y);
                    const br = getFNode(x + 1, y + 1);
                    const bl = getFNode(x, y + 1);

                    setAdj(tl, tr);
                    setAdj(tr, br);
                    setAdj(br, bl);
                    setAdj(bl, tl);
                }
            }

            // Merge Horizontal (South paths)
            // Check "bottom" wall of each cell (except last row)
            for (let my = 0; my < mazeRows - 1; my++) {
                for (let mx = 0; mx < mazeCols; mx++) {
                    // Wall between cell (mx, my) and cell (mx, my+1)
                    // This is wallsH[(my+1) * mazeCols + mx]
                    if (wallsH[(my + 1) * mazeCols + mx] === 0) { // No wall -> Connected
                        // Merge Cell(mx, my) with Cell(mx, my+1)
                        // Top cell (mx, my) bottom edge: BL-BR
                        // Bottom cell (mx, my+1) top edge: TL-TR

                        const top_bl = getFNode(mx * 2, my * 2 + 1);
                        const top_br = getFNode(mx * 2 + 1, my * 2 + 1);

                        const bot_tl = getFNode(mx * 2, (my + 1) * 2);
                        const bot_tr = getFNode(mx * 2 + 1, (my + 1) * 2);

                        removeAdj(top_bl, top_br); // Remove bottom edge of top cell
                        removeAdj(bot_tl, bot_tr); // Remove top edge of bottom cell

                        setAdj(top_bl, bot_tl); // Connect left-left
                        setAdj(top_br, bot_tr); // Connect right-right
                    }
                }
            }

            // Merge Vertical (East paths)
            for (let my = 0; my < mazeRows; my++) {
                for (let mx = 0; mx < mazeCols - 1; mx++) {
                    if (wallsV[my * (mazeCols + 1) + (mx + 1)] === 0) {

                        const left_tr = getFNode(mx * 2 + 1, my * 2);
                        const left_br = getFNode(mx * 2 + 1, my * 2 + 1);

                        const right_tl = getFNode((mx + 1) * 2, my * 2);
                        const right_bl = getFNode((mx + 1) * 2, my * 2 + 1);

                        removeAdj(left_tr, left_br);
                        removeAdj(right_tl, right_bl);

                        setAdj(left_tr, right_tl);
                        setAdj(left_br, right_bl);
                    }
                }
            }

            // 4. Trace the single Hamiltonian Cycle
            const path = [];
            let curr = 0; // Start at fine grid (0,0)
            let prev = -1;

            // Find first neighbor to start
            // Just pick adj[0]

            const limit = fCols * fRows * 4; // Safety limit to prevent infinite loops
            for (let i = 0; i < limit; i++) {
                // Add Point
                const px = curr % fCols;
                const py = Math.floor(curr / fCols);
                path.push({ x: this.bounds.x1 + px, y: this.bounds.y1 + py });

                const n1 = adj[curr * 2];
                const n2 = adj[curr * 2 + 1];

                let next = -1;
                if (i === 0) {
                    // For the very first step, pick one of the neighbors.
                    // If n1 is -1, try n2. If both are -1, something is wrong.
                    next = (n1 !== -1) ? n1 : n2;
                } else {
                    // For subsequent steps, pick the neighbor that is not 'prev'
                    next = (n1 === prev) ? n2 : n1;
                }

                if (next === -1 || next === undefined) break; // Should not happen in a valid cycle
                if (next === 0) break; // Loop closed, returned to start node

                prev = curr;
                curr = next;
            }

            // 5. Rotate and Assign
            // Find a "Straight" section to break the loop so ends align nicely
            if (path.length > 2) {
                let bestOffset = 0;
                // Try to find a sequence of 3 points that are collinear
                // p[i-1] -> p[i] -> p[i+1]
                for (let i = 0; i < path.length; i++) {
                    const prev = path[(i - 1 + path.length) % path.length];
                    const curr = path[i];
                    const next = path[(i + 1) % path.length];

                    // Check collinearity: (y2-y1)/(x2-x1) == (y3-y2)/(x3-x2)
                    // Or simplified: dx1*dy2 == dy1*dx2
                    const dx1 = curr.x - prev.x;
                    const dy1 = curr.y - prev.y;
                    const dx2 = next.x - curr.x;
                    const dy2 = next.y - curr.y;

                    if (dx1 === dx2 && dy1 === dy2) {
                        bestOffset = i;
                        // Add randomness: 50% chance to take this one, or keep looking for another
                        if (Math.random() > 0.5) break;
                    }
                }

                // If no collinear found (unlikely in grid), Random fallback
                if (bestOffset === 0) bestOffset = Math.floor(Math.random() * path.length);

                // Apply rotation
                const rotated = [];
                for (let i = 0; i < path.length; i++) {
                    rotated.push(path[(bestOffset + i) % path.length]);
                }

                this.points = rotated.map(p => ({
                    x: p.x * this.gridSize + this.gridSize / 2,
                    y: p.y * this.gridSize + this.gridSize / 2
                }));
            } else {
                // Fallback if path generation failed or grid too small
                this.points = [];
            }
        }

        reset() {
            this.path = [];
            this.animateIndex = 0;
            this.segmentProgress = 0;
            this.isDone = false;
            this.finishAnim = 0; // 0 to 1 for end bounce animation
            this.speed = 4; // Initial slow speed
            this.generatePath();
        }

        update() {
            if (this.isDone) {
                // End Bounce Animation
                if (this.finishAnim < 1) {
                    this.finishAnim += 0.05; // Speed of bounce
                    if (this.finishAnim > 1) this.finishAnim = 1;
                }
                return;
            }
            this.segmentProgress += this.speed;

            if (this.animateIndex < this.points.length - 1) {
                const p1 = this.points[this.animateIndex];
                const p2 = this.points[this.animateIndex + 1];
                const dist = Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);

                if (this.segmentProgress >= dist) {
                    this.segmentProgress = 0;
                    this.animateIndex++;
                }
            } else {
                this.isDone = true;
            }
        }

        drawEndCap(x, y, dx, dy, img, scaleMod = 1, rotationMod = 0) {
            if (!img || !img.complete) return;
            this.ctx.save();
            this.ctx.translate(x, y);

            let angle = Math.atan2(dy, dx) + Math.PI / 2;
            angle += rotationMod;
            this.ctx.rotate(angle);

            // MASK: Draw a black block to "hard cut" the white line behind the cap image
            const maskW = this.thickness + 10;
            const maskH = 6;
            this.ctx.fillStyle = '#080808';
            // Positioned slightly overlapping the line end (0,0)
            this.ctx.fillRect(-maskW / 2, -maskH / 2, maskW, maskH);

            // Scale cap 
            const widthBoost = 2; // User requested +2px
            const w = (this.thickness + widthBoost) * scaleMod;
            const scale = w / img.naturalWidth;
            const h = img.naturalHeight * scale;

            // Offset for a 0px gap (seamless) between the line end and the wrist/ankle
            const gap = 0;

            let drawX = -w / 2;
            let drawY = -h - gap;

            if (img === footImage) {
                // User requested 180 deg flip to face outward.
                this.ctx.rotate(Math.PI);
                // Draw at Positive Y to appear at Negative Y (Outside) in rotated frame
                // X is symmetric (-w/2) so rotation doesn't shift it.
                this.ctx.drawImage(img, -w / 2, gap, w, h);
            } else {
                this.ctx.drawImage(img, drawX, drawY, w, h);
            }

            this.ctx.restore();
        }

        draw() {
            if (this.points.length < 2) return;

            // Calculate visible length based on animation
            let endIndex = this.animateIndex;
            let pNext = this.points[endIndex + 1];
            let pCurr = this.points[endIndex];

            // If complete, we show everything
            if (this.isDone) {
                endIndex = this.points.length - 2;
                pCurr = this.points[endIndex];
                pNext = this.points[endIndex + 1];
            }

            // Draw the main White Stroke (Thick)
            this.ctx.lineCap = 'butt';
            this.ctx.lineJoin = 'round';
            this.ctx.lineWidth = this.thickness;
            this.ctx.strokeStyle = this.color;
            this.ctx.beginPath();

            // 1. Determine Start Point (Shortened by thickness to allow "Leg" + Hand offset)
            // Actually, if we want closed ends, we can just start exactly at the point.
            // User asked for "height will be subtracted to leg end points".
            // Let's shorten the very first and very last segments by `thickness`.

            // Image dimensions: Source is 400px width.
            // We want image width to match thickness.
            // Scale factor = thickness / 400.
            // Height in pixels = (ImageHeight) * (thickness / 400).
            // Since user said "400px width/height", let's assume square or allow aspect ratio.
            // Actually, we need to know the height to subtract from the line length.

            // Define helpers
            const getImg = (type) => {
                if (type === 'hand') return handImage;
                if (type === 'foot') return footImage;
                if (type === 'head') return headImage;
                return null;
            };

            const startImg = getImg(this.startCapType);
            const endImg = getImg(this.endCapType);

            // Calculate offsets based on actual image aspect ratio
            // Default to thickness if image not loaded yet
            let handOffset = 0; // Renamed from startOffset to be more specific
            let footOffset = 0; // Renamed from endOffset to be more specific

            if (startImg && startImg.complete && startImg.naturalWidth > 0) {
                const ratio = this.thickness / startImg.naturalWidth;
                handOffset = startImg.naturalHeight * ratio;
            }

            if (endImg && endImg.complete && endImg.naturalWidth > 0) {
                const ratio = this.thickness / endImg.naturalWidth;
                footOffset = endImg.naturalHeight * ratio;
            }

            // Draw the main White Stroke (Thick)
            this.ctx.lineCap = 'butt'; // Force square ends
            this.ctx.lineJoin = 'round'; // Keep round joins for corners? Or miter?
            // User requested "square cap ends".
            this.ctx.lineWidth = this.thickness;
            this.ctx.strokeStyle = this.color;
            this.ctx.beginPath();

            // 1. Determine Start Point (Shortened by handOffset)
            const pStart = this.points[0];
            const pStartNext = this.points[1];

            // Accurate vector for start segment (always straight grid line)
            const startDx = pStartNext.x - pStart.x;
            const startDy = pStartNext.y - pStart.y;
            const startLen = Math.sqrt(startDx * startDx + startDy * startDy);

            let startX = pStart.x;
            let startY = pStart.y;

            if (startLen > handOffset && handOffset > 0) {
                startX += (startDx / startLen) * handOffset;
                startY += (startDy / startLen) * handOffset;
            }

            this.ctx.moveTo(startX, startY);

            // MIDDLE POINTS (With Quadratic Curves)
            // We draw straight lines to "Near Corner" and curve to "After Corner"
            const r = this.gridSize * 0.5; // Rounding radius

            // Only round if we have a next point
            for (let i = 1; i <= endIndex; i++) {
                const pPrev = this.points[i - 1];
                const pCurr = this.points[i];
                // Next point exists?
                // If i == endIndex, adjacent point is p[endIndex+1].
                // Is it valid?
                let pNext = this.points[i + 1];

                if (!pNext) {
                    // This happens if endIndex is the very last point (isDone).
                    // Just LineTo
                    this.ctx.lineTo(pCurr.x, pCurr.y);
                    continue;
                }

                // Calculate direction vectors for "Prev->Curr" and "Curr->Next"
                // But simpler: Corner pCurr.
                // Radius r.
                // Tangent points:
                // T1 = pCurr - (pCurr - pPrev).normalized * r
                // T2 = pCurr + (pNext - pCurr).normalized * r

                // Vector 1 (Entering corner)
                const v1x = pCurr.x - pPrev.x;
                const v1y = pCurr.y - pPrev.y;
                const len1 = Math.sqrt(v1x * v1x + v1y * v1y);

                // Vector 2 (Leaving corner)
                const v2x = pNext.x - pCurr.x;
                const v2y = pNext.y - pCurr.y;
                const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

                // Effective radius must be smaller than half segment length
                const effR = Math.min(r, len1 / 2, len2 / 2);

                // Tangent 1
                const t1x = pCurr.x - (v1x / len1) * effR;
                const t1y = pCurr.y - (v1y / len1) * effR;

                // Tangent 2
                const t2x = pCurr.x + (v2x / len2) * effR;
                const t2y = pCurr.y + (v2y / len2) * effR;

                this.ctx.lineTo(t1x, t1y);
                this.ctx.quadraticCurveTo(pCurr.x, pCurr.y, t2x, t2y);
            }

            // END POINT CALCULATION (Head)
            let headX, headY;
            let headDx, headDy;

            if (this.isDone) {
                // Full path - retract the end based on footOffset
                const pLast = this.points[this.points.length - 1];
                const pPrev = this.points[this.points.length - 2];

                const dx = pLast.x - pPrev.x;
                const dy = pLast.y - pPrev.y;
                const len = Math.sqrt(dx * dx + dy * dy);

                headDx = dx;
                headDy = dy;

                // Retract end
                if (len > footOffset && footOffset > 0) {
                    headX = pLast.x - (dx / len) * footOffset;
                    headY = pLast.y - (dy / len) * footOffset;
                } else {
                    headX = pLast.x;
                    headY = pLast.y;
                }
            } else {
                // Animating
                // Calculate current head position based on progress
                if (pNext) {
                    const dx = pNext.x - pCurr.x;
                    const dy = pNext.y - pCurr.y;
                    headDx = Math.sign(dx);
                    headDy = Math.sign(dy);

                    headX = pCurr.x + (headDx * this.segmentProgress);
                    headY = pCurr.y + (headDy * this.segmentProgress);
                } else {
                    headX = pCurr.x;
                    headY = pCurr.y;
                }
            }

            this.ctx.lineTo(headX, headY);
            this.ctx.stroke();

            // Draw Inner Stroke (The Fill/Cutout) - Creates Outline Loop
            // We need to draw the EXACT SAME path but with a thinner stroke.
            // AND we want to clip the ends to create the "Closed" cap effect.

            const borderW = 4; // Total border width (2px each side)
            const capInset = 4; // How far to inset the black line to create the "Cap"

            this.ctx.lineWidth = this.thickness - borderW;
            this.ctx.strokeStyle = '#080808';
            this.ctx.lineCap = 'butt'; // Important for the "cut" look
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();

            // Inner Middle (Curved)
            {
                // Reset to Inner Start logic first
                // Inner Start
                if (startLen > 0.1) {
                    const innerOffset = handOffset + capInset;
                    const innerStartX = pStart.x + (startDx / startLen) * innerOffset;
                    const innerStartY = pStart.y + (startDy / startLen) * innerOffset;
                    this.ctx.moveTo(innerStartX, innerStartY);
                } else {
                    this.ctx.moveTo(startX, startY);
                }

                const r = this.gridSize * 0.5;

                for (let i = 1; i <= endIndex; i++) {
                    const pPrev = this.points[i - 1];
                    const pCurr = this.points[i];
                    let pNext = this.points[i + 1];

                    if (!pNext) {
                        this.ctx.lineTo(pCurr.x, pCurr.y);
                        continue;
                    }

                    const v1x = pCurr.x - pPrev.x;
                    const v1y = pCurr.y - pPrev.y;
                    const len1 = Math.sqrt(v1x * v1x + v1y * v1y);

                    const v2x = pNext.x - pCurr.x;
                    const v2y = pNext.y - pCurr.y;
                    const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

                    const effR = Math.min(r, len1 / 2, len2 / 2);

                    const t1x = pCurr.x - (v1x / len1) * effR;
                    const t1y = pCurr.y - (v1y / len1) * effR;

                    const t2x = pCurr.x + (v2x / len2) * effR;
                    const t2y = pCurr.y + (v2y / len2) * effR;

                    this.ctx.lineTo(t1x, t1y);
                    this.ctx.quadraticCurveTo(pCurr.x, pCurr.y, t2x, t2y);
                }
            }

            // Inner End
            {
                let lx = headX;
                let ly = headY;

                // Retract if we have a vector
                const hLen = Math.sqrt(headDx * headDx + headDy * headDy);
                if (hLen > 0) {
                    lx -= (headDx / hLen) * capInset;
                    ly -= (headDy / hLen) * capInset;
                }
                this.ctx.lineTo(lx, ly);
            }

            this.ctx.stroke();

            // Draw Caps
            // Images must be placed at the EXACT end of the visible line (startX / headX)
            // Previous logic used pStart/pStartNext vector.
            // Rotation is perpendicular to line?
            // Let's verify standard drawEndCap:
            // angle = atan2(dy, dx) + PI/2.
            // If line is vertical down (dy=1, dx=0), angle = PI/2 + PI/2 = PI (180).
            // Image rotated 180 (upside down).
            // If hand image is "Flat Hand Points Up", rotated 180 means Points Down. Correct.

            if (this.startCapType !== 'none' && startImg) {
                // Direction: P0 -> P1.
                // Line starts at P0+offset.
                // Cap should face AWAY from P1. Direction P1->P0.
                // Vector (-dx, -dy).
                if (Math.abs(startDx) > 0.01 || Math.abs(startDy) > 0.01) {
                    this.drawEndCap(startX, startY, -startDx, -startDy, startImg);
                }
            }

            if (this.endCapType !== 'none' && endImg) {
                // Direction: line ending at headX.
                // Vector is headDx, headDy (Calculated from last segment direction).
                // Cap should face OUTWARDS (same direction as line flow).
                if (Math.abs(headDx) > 0.01 || Math.abs(headDy) > 0.01) {
                    // Apply Bounce Animation
                    let scale = 1;
                    let rotation = 0;

                    if (this.isDone && this.finishAnim > 0) {
                        // Elastic Out Easing
                        // sin wave dampening
                        const t = this.finishAnim;
                        const elastic = Math.sin(t * Math.PI * 3) * Math.exp(-t * 2.5) * 0.4;
                        // Scale: Pop larger then settle
                        scale = 1 + elastic;
                        // Rotation: Wiggle slightly opposite to scale?
                        rotation = elastic * 0.2;
                    }

                    this.drawEndCap(headX, headY, headDx, headDy, endImg, scale, rotation);
                }
            }

            // Draw Obstacle (Floating Head)
            if (this.obstacleType !== 'none' && this.obstacleCell) {
                const img = (this.obstacleType === 'head') ? headImage : null;
                if (img && img.complete) {
                    // Calculate center of the obstacle maze cell
                    // Maze cell (ox, oy) covers fine grid (2*ox, 2*oy) to (2*ox+2, 2*oy+2)
                    // Center in fine grid coords: 2*ox + 1, 2*oy + 1
                    // Pixel coords:
                    const centerX = (this.bounds.x1 + this.obstacleCell.x * 2 + 1) * this.gridSize; // + gridSize/2 ? No. 
                    // this.points logic: p.x = fineX * gridSize + gridSize/2.
                    // So center of fine cell (fx, fy) is (fx*gridSize + gridSize/2, ...)
                    // The "Hole" is a 2x2 fine block.
                    // The exact center of the 2x2 block is at fine coord (2*ox + 1, 2*oy + 1)?
                    // Corners: TL(2ox, 2oy), BR(2ox+2, 2oy+2).
                    // Midpoint: (2ox+1, 2oy+1).
                    // Pixel X = (this.bounds.x1 + 2*this.obstacleCell.x + 1) * this.gridSize?
                    // No. 
                    // Grid point (x,y) is at x * gridSize + gridSize/2.
                    // We want the visual center of 4 grid points? Or the center of the void?
                    // The void is "inside" the loop formed by 2x2.
                    // The loop goes through centers of the 4 fine cells.
                    // The geometric center is at the vertex shared by the 4 cells.
                    // Fine coord index (2ox+1, 2oy+1)? No...
                    // Let's deduce:
                    // TL cell center: (2ox * G + G/2, 2oy * G + G/2)
                    // BR cell center: ((2ox+1) * G + G/2, (2oy+1) * G + G/2)
                    // Average X = (2ox + 0.5 + 2ox + 1.5) * G / 2 = (4ox + 2) * G / 2 ??
                    // Center X = (2ox * G + G/2 + 2ox * G + 1.5G) / 2?
                    // Simply: (2ox + 1) * G.

                    // Yes. (2*ox * G) is left edge of TL. (2*ox+2)*G is right edge of BR.
                    // Midpoint is (2*ox + 1) * G.

                    const pixelX = (this.bounds.x1 + this.obstacleCell.x * 2 + 1) * this.gridSize;
                    const pixelY = (this.bounds.y1 + this.obstacleCell.y * 2 + 1) * this.gridSize;

                    // Draw Check
                    // User wants Head "randomly placed".
                    // Size? "match size of the snake 1 line thickness".
                    // Currently w = thickness.
                    // But the hole is 2x2 cells.
                    // So it fits easily.

                    const scale = this.thickness / img.naturalWidth; // Or just force thickness
                    // But if it's too small in a large hole it looks lonely.
                    // User said "find a gap ... and make sure maze folds around it".
                    // If I use my obstacle logic, the gap is 2x2 cells.
                    // Let's stick to thickness * 1.2 for visibility, or just thickness as requested.
                    // I'll do thickness * 1.5 purely for aesthetics in the hole, user can ask to shrink.
                    // User said "find a gap ... and make sure maze folds around it".
                    // Increasing size to reduce visual gap.
                    // Tweaked down to 1.1 per user request "shrink ... a bit"
                    const renderW = this.thickness * 1.1;
                    const renderH = img.naturalHeight * (renderW / img.naturalWidth);

                    this.ctx.save();
                    this.ctx.translate(pixelX, pixelY);

                    let rotation = 0;
                    if (this.isDone && this.finishAnim > 0) {
                        // Elastic Out for rotation
                        const t = this.finishAnim;
                        // Damped sine wave centering on 1.0
                        // We want it to go from 0 to 1 * Target

                        // Standard Elastic Out?
                        // p = 0.3
                        // return pow(2, -10*t) * sin((t-p/4)*(2*PI)/p) + 1;

                        // Simplified spring for visual pop:
                        // Overshoot and settle
                        const p = 0.4;
                        const s = p / 4;
                        const val = (t === 1) ? 1 : Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;

                        rotation = this.targetObstacleRotation * val;
                    } else if (this.isDone && this.finishAnim >= 1) {
                        rotation = this.targetObstacleRotation;
                    }

                    this.ctx.rotate(rotation);
                    this.ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
                    this.ctx.restore();
                }
            }
        }
    }


    let snakes = [];
    let animationFrameId = null;
    let isVisible = false;
    let canvas, ctx;

    function initMaze() {
        canvas = document.getElementById('fancyFooter');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        const randomSplitDecision = Math.random() > 0.5; // Persist decision across resizes

        function resize() {
            // High DPI / Retina support
            const dpr = window.devicePixelRatio || 1;
            const width = window.innerWidth;
            const height = 760; // Fixed height per user request (Updated from 800)

            if (width <= 0) return;

            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            canvas.width = width * dpr;
            canvas.height = height * dpr;

            ctx.resetTransform();

            const gap = 2; // User requested smaller gap "like 2px"
            let targetThickness = width > 768 ? 96 : 56;
            let gridSize = targetThickness + gap;

            // Calculate approx cols
            let cols = Math.round(width / gridSize);
            // Recalculate grid size to perfectly fill WIDTH
            if (cols < 2) cols = 2; // Minimum
            if (cols % 2 !== 0) cols++;

            const finalGridSize = width / cols;
            const thickness = finalGridSize - gap;
            gridSize = finalGridSize;

            // Calculate Rows based on fixed height
            let rows = Math.round(height / gridSize);
            // Ensure even count
            if (rows % 2 !== 0) rows++;

            const scaleY = height / (rows * gridSize);

            // Apply Scale
            ctx.setTransform(dpr, 0, 0, dpr * scaleY, 0, 0); // Stretch vertically to fill 760px exactly

            // Layout Decision:
            const isVertical = (width > 768) && randomSplitDecision;

            if (isVertical) {
                // 50/50 Vertical Split
                const midCol = cols / 2;

                snakes = [
                    // Left: Snake 1 (Hand + Hand + Head)
                    new GenerativeSnake(canvas, ctx, '#FFFFFF', thickness, gridSize, {
                        x1: 0, y1: 0, x2: midCol, y2: rows
                    }, 'hand', 'hand', 'head'),

                    // Right: Snake 2 (Foot + Foot)
                    new GenerativeSnake(canvas, ctx, '#FFFFFF', thickness, gridSize, {
                        x1: midCol, y1: 0, x2: cols, y2: rows
                    }, 'foot', 'foot')
                ];
            } else {
                // 50/50 Horizontal Split (Default)
                const midRow = Math.floor(rows / 2);

                snakes = [
                    // Top: Snake 1 (Hand + Hand + Head)
                    new GenerativeSnake(canvas, ctx, '#FFFFFF', thickness, gridSize, {
                        x1: 0, y1: 0, x2: cols, y2: midRow
                    }, 'hand', 'hand', 'head'),

                    // Bottom: Snake 2 (Foot + Foot)
                    new GenerativeSnake(canvas, ctx, '#FFFFFF', thickness, gridSize, {
                        x1: 0, y1: midRow, x2: cols, y2: rows
                    }, 'foot', 'foot')
                ];
            }
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;

                // Only allow isVisible to be true if we are in 'work' mode
                const isWorkMode = !window.portfolioModeToggle || window.portfolioModeToggle.getCurrentMode() === 'work';
                if (!isWorkMode) isVisible = false;

                if (isVisible) {
                    if (!animationFrameId) animate();
                } else {
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                    }
                }
            });
        }, { threshold: 0.1 });

        observer.observe(canvas);

        window.addEventListener('resize', () => {
            resize();
            if (isVisible && !animationFrameId) animate();
        });

        resize();
    }

    function animate() {
        if (!isVisible || !ctx) {
            animationFrameId = null;
            return;
        }

        // Efficient Clear
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        let allDone = true;

        snakes.forEach(s => {
            if (!s.isDone) {
                for (let i = 0; i < 4; i++) s.update();
                allDone = false;
            } else {
                s.update();
                if (s.finishAnim < 1) allDone = false;
            }
        });

        snakes.forEach(s => s.draw());

        if (!allDone) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            animationFrameId = null;
        }
    }

    function stopAnimator() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        isVisible = false;
    }

    // Export to window so modeToggle can stop it
    window.footerMazeControl = {
        stop: stopAnimator,
        resume: () => {
            // Check if we are in work mode before resuming
            if (window.portfolioModeToggle && window.portfolioModeToggle.getCurrentMode() !== 'work') return;
            isVisible = true;
            if (!animationFrameId) animate();
        }
    };

    document.addEventListener('DOMContentLoaded', initMaze);
    if (document.readyState !== 'loading') initMaze();
})();
