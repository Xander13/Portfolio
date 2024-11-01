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
                  

You got hungry and wanted some fried chicken.

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

console.log('Hello from this side! It\'s great \nto meet you. The console will show \nyou how many times you have scrolled!');
console.log('');
console.log('Every 5 times you scroll, you\'ll \nreceive a delightful message from me!');
console.log('');

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
                        "Wow, you really enjoy this! I hope \nyour day is going wonderfully!",
                        "This is fantastic! May your day \nshine as bright as you!",
                        "Spectacular! Your positivity is sure \nto inspire others!",
                        "Wonderful! May your day be filled with \njoy and prosperity!",
                        "Amazing! Your enthusiasm is contagious; \nkeep it up!",
                        "Incredible! Each scroll adds a little \nmore joy to your day!",
                        "Fabulous! Your spirit brings so much \nlight to the world!",
                        "Outstanding! Keep spreading those \ngood vibes!",
                        "Brilliant! Your joy is a gift to \neveryone around you!",
                        "Joyful! Your energy brightens even \nthe cloudiest days!"
                    ];
                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                    console.log(randomMessage);
                }

                // Specific messages for scroll counts 10 to 15
                if (numScrollAmount === 12) {
                    console.log("The egg is doing something!");
                }
                if (numScrollAmount === 13) {
                    console.log("The egg is shaking!");
                }
                if (numScrollAmount === 14) {
                    console.log("The egg is starting to crack!");
                }
                if (numScrollAmount === 15) {
                    console.log(chickenArt); // Show the chicken after the 15th scroll
                }
                if (numScrollAmount === 50) {
                    console.log(chickenLeg); // Show the chicken Legs after the 30th scroll
                }
            }
        });
    } else {
        console.error("Required elements not found in the DOM.");
    }
});

// Fade in and out About section
$(document).ready(function () {
    $('#ToggleAbouts').on('click', function () {
        $('#ViewAbout').fadeToggle(500); // 500ms duration for fade
    });
});