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
$(document).ready(function () {
    $('#ToggleAbouts').on('click', function () {
        $('#ViewAbout').fadeToggle(500); // 500ms duration for fade
    });
});