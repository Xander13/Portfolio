// Chicken ASCII art for the 15th message
const chickenArt = ` 
                                                              
                              ██                  
                            ██▒▒██                
                          ██▒▒▒▒▒▒██              
                          ██  ▒▒▒▒▒▒██            
                        ██  ██  ▒▒██              
                        ██    ▒▒░░░░██            
    ██                  ██    ▒▒▒▒██              
  ██  ██                ██      ▒▒██              
██      ████          ██  ██      ▒▒██            
  ██        ██████████  ██        ▓▓              
██                    ██          ██              
██              ▓▓██                ██            
  ██          ██                    ██            
  ██  ██    ██                      ██            
  ████  ██  ██          ██          ██            
  ██  ██  ██          ██          ████            
    ██  ██          ██          ██  ██            
      ██  ██████████  ██  ██  ██  ██              
        ██  ██  ██  ██  ██  ██  ██                
        ████  ██  ██  ██  ██████                  
          ████  ██  ██  ████                      
              ████████████                        
                                                                

`;

const chickenLeg = `

      ████████              ████████    
  ██████▒▒▒▒████        ██████▒▒▒▒████  
████▒▒▒▒▒▒▒▒▒▒████    ████▒▒▒▒▒▒▒▒▒▒████
██▒▒▒▒▒▒▒▒▒▒▒▒▒▒██    ██▒▒▒▒▒▒▒▒▒▒██
██▒▒▒▒▒▒▒▒▒▒▒▒▒▒██    ██▒▒▒▒▒▒▒▒██
██▒▒▒▒▒▒▒▒▒▒▒▒▒▒██    ██▒▒▒▒▒▒▒██
████▒▒▒▒▒▒▒▒▒▒████    ████▒▒▒▒▒▒██
  ████▒▒▒▒▒▒████        ████▒▒▒▒▒▒▒▒██  
    ██▒▒▒▒▒▒██            ██▒▒▒▒▒▒██    
    ██▒▒▒▒▒▒██            ██▒▒▒▒▒▒██    
    ██████████            ██████████    
      ██  ██                ██  ██      
      ██  ██                ██  ██      
    ██  ██  ██            ██  ██  ██    
    ████  ████            ████  ████    
                  

You got hungry and started craving some \ngolden, crispy Midwest fried chicken! 🍗

`;

console.log(`    
    
          ████████                                  
        ██        ██                                
      ██▒▒▒▒        ██                              
    ██▒▒▒▒▒▒      ▒▒▒▒██                            
    ██▒▒▒▒▒▒      ▒▒▒▒██                            
  ██  ▒▒▒▒        ▒▒▒▒▒▒██                          
  ██                ▒▒▒▒██                          
██▒▒      ▒▒▒▒▒▒          ██                        
██      ▒▒▒▒▒▒▒▒▒▒        ██                        
██      ▒▒▒▒▒▒▒▒▒▒    ▒▒▒▒██                        
██▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒██                        
  ██▒▒▒▒  ▒▒▒▒▒▒    ▒▒▒▒██                          
  ██▒▒▒▒            ▒▒▒▒██                          
    ██▒▒              ██                            
      ████        ████                              
          ████████    


`);

console.log('\nHello from this side! It\'s great \nto meet you. Watch the console to \nsee how many times you\'ve scrolled!\n\n');
console.log('\nEvery 5 scrolls, you\'ll get a \ndelightful message from me!\n\n');
console.log('\nScroll 15 times to hatch the egg! \n\nUp for a challenge? Reach 20 scrolls \nand see the chicken surprise!\n\n');

document.addEventListener("DOMContentLoaded", () => {
    const scrollContent = document.getElementById("scrollContent");
    const contentWrapper = document.getElementById("contentWrapper");

    let numScrollAmount = 0; // Counter for scroll resets

    if (scrollContent && contentWrapper) {
        // Clone the main content
        const clonedContent = scrollContent.cloneNode(true);
        clonedContent.id = "clonedContent"; // Unique ID for the clone
        contentWrapper.appendChild(clonedContent);

        // Update the scroll event listener
        window.addEventListener("scroll", () => {
            const scrollableHeight = scrollContent.offsetHeight;

            // Reset scroll when reaching the top of the cloned content
            if (window.scrollY >= scrollableHeight) {
                window.scrollTo(0, 0);
                numScrollAmount++; // Increment the scroll counter

                // Log general scroll message
                if (numScrollAmount <= 9) {
                    console.log(`You scrolled ${numScrollAmount} times! :) Egg is incubating!`); // Keep scroll count for the first 9
                } else {
                    console.log(`You scrolled ${numScrollAmount} times! :)`); // For 10 and beyond
                }

                // Log a positive message every 5 scrolls
                if (numScrollAmount % 5 === 0) {
                    const messages = [
                        "\nWow, you really enjoy this! I hope \nyour day is going wonderfully!\n\n",
                        "\nThis is fantastic! May your day \nshine as bright as you!\n\n",
                        "\nSpectacular! Your positivity is sure \nto inspire others!\n\n",
                        "\nWonderful! May your day be filled with \njoy and prosperity!\n\n",
                        "\nAmazing! Your enthusiasm is contagious; \nkeep it up!\n\n",
                        "\nIncredible! Each scroll adds a little \nmore joy to your day!\n\n",
                        "\nFabulous! Your spirit brings so much \nlight to the world!\n\n",
                        "\nOutstanding! Keep spreading those \ngood vibes!\n\n",
                        "\nBrilliant! Your joy is a gift to \neveryone around you!\n\n",
                        "\nJoyful! Your energy brightens even \nthe cloudiest days!\n\n"
                    ];
                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                    console.log(randomMessage);
                }

                // Specific messages for scroll counts 10 to 15
                if (numScrollAmount === 12) {
                    console.log("\nThe egg is doing something!\n\n");
                }
                if (numScrollAmount === 13) {
                    console.log("\nThe egg is shaking!\n\n");
                }
                if (numScrollAmount === 14) {
                    console.log("\nThe egg is starting to crack!\n\n");
                }
                if (numScrollAmount === 15) {
                    console.log(chickenArt); // Show the chicken after the 15th scroll
                }
                if (numScrollAmount === 20) {
                    console.log(chickenLeg); // Show the chicken Legs after the 30th scroll
                }
            }
        });
    } else {
        console.error("Required elements not found in the DOM.");
    }
});

// Fade in and out About section
$("#ToggleAbouts").click(function() {
  $("#ViewAbout").fadeToggle();
});


function updateDetroitTime() {
  const options = { timeZone: 'America/Detroit', hour: 'numeric', minute: '2-digit', hour12: true };
  let detroitTime = new Intl.DateTimeFormat('en-US', options).format(new Date());

  // Make the colon blink
  detroitTime = detroitTime.replace(":", "<span id='blinkingColon'>:</span>");
  document.getElementById('detroitTime').innerHTML = detroitTime;
}

// Update every minute
setInterval(updateDetroitTime, 60000);

// Initialize on page load
updateDetroitTime();

// Blink colon every second
setInterval(() => {
  const colon = document.getElementById('blinkingColon');
  if (colon) colon.style.visibility = colon.style.visibility === 'hidden' ? 'visible' : 'hidden';
}, 1000);


// fun ball js script
const { Engine, Render, Runner, Bodies, World } = Matter;

// Create an engine and a renderer
const engine = Engine.create();
engine.gravity.y = 1; // Gravity to simulate realistic falling

const render = Render.create({
    element: document.querySelector('.funBall'),
    engine: engine,
    options: {
        width: 1500,
        height: 1500,
        wireframes: false,
        background: 'transparent'
    }
});

// Array to hold created ball elements
const balls = [];

// Function to add a ball of fixed size (300px diameter) to the world
function addBall() {
    const isBall1 = Math.random() < 0.5;
    const ballImage = isBall1 ? 'Ball.svg' : 'Ball2.svg';
    const radius = 150; // Fixed radius for 300px diameter

    const x = 750 + (Math.random() - 0.5) * 100;
    const y = 750 + (Math.random() - 0.5) * 100;

    const ball = Bodies.circle(x, y, radius, {
        density: 0.5, // Maintain reasonable density
        restitution: 0.5, // Default restitution for initial bounciness
        friction: 0.05, // Slight friction for realistic rolling
        frictionAir: 0.01, // Light air friction
        render: {
            sprite: {
                texture: ballImage,
                xScale: (radius * 2) / 400,
                yScale: (radius * 2) / 400
            }
        }
    });
    
    World.add(engine.world, ball);
    balls.push(ball);
}

// Create boundaries to contain the balls within the 1500x1500 area
const ground = Bodies.rectangle(750, 1510, 1500, 20, { isStatic: true });
const ceiling = Bodies.rectangle(750, -10, 1500, 20, { isStatic: true });
const leftWall = Bodies.rectangle(-10, 750, 20, 1500, { isStatic: true });
const rightWall = Bodies.rectangle(1510, 750, 20, 1500, { isStatic: true });

World.add(engine.world, [ground, ceiling, leftWall, rightWall]);

// Populate with fixed-size balls
for (let i = 0; i < 10; i++) {
    addBall();
}

// Variables for tracking scroll speed
let lastScrollY = window.scrollY;
let scrollTimeout;
let maxBounce = 1.45; // Increased maximum bounce value
let bounceMultiplier = 1; // Current bounce multiplier

// Scroll event listener on the window
window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const scrollSpeed = Math.abs(currentScrollY - lastScrollY); // Get the speed of the scroll

    // Update bounciness based on scroll speed
    bounceMultiplier = Math.min(maxBounce, 0.75 + scrollSpeed / 50); // Adjust bounciness to be more sensitive

    balls.forEach(ball => {
        // Apply a force that mimics bounciness based on the scroll speed
        ball.restitution = bounceMultiplier; // Set the restitution to the bounce multiplier
    });

    lastScrollY = currentScrollY;

    // Clear the previous timeout
    clearTimeout(scrollTimeout);

    // Set a timeout to gradually slow down the bounce effect after scrolling stops
    scrollTimeout = setTimeout(() => {
        bounceMultiplier = Math.max(0.5, bounceMultiplier - 0.05); // Gradually reduce the bounce multiplier
        balls.forEach(ball => {
            ball.restitution = bounceMultiplier; // Apply reduced bounciness
        });
    }, 100); // Adjust the timeout duration if necessary
});

// Run the renderer and the engine
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);
