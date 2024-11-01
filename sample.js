console.log(`                  
                                                
                              ████                              
                            ██░░░░██                            
                          ██░░░░░░░░██                          
                          ██░░░░░░░░██                          
                        ██░░░░░░░░░░░░██                        
                        ██░░░░░░░░░░░░██                        
                        ██░░░░░░░░░░░░██                        
                          ██░░░░░░░░██                          
                            ████████ 
                                                         
`);
console.log('Hello from this side! It\'s great to meet you. The console will show you how many times you\'ve scrolled!');
console.log('');
console.log('Every 5 times you scrolled, you\'ll receive a delightful message from me!');
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
                console.log(`You scrolled ${numScrollAmount} times! :)`);

                // Log a positive message every 10 scrolls
                if (numScrollAmount % 5 === 0) {
                    const messages = [
                        "Wow, you really enjoy this! I hope your day is going wonderfully!",
                        "This is fantastic! May your day shine as bright as you!",
                        "Spectacular! Your positivity is sure to inspire others!",
                        "Wonderful! May your day be filled with joy and prosperity!",
                        "Amazing! Your enthusiasm is contagious; keep it up!",
                        "Incredible! Each scroll adds a little more joy to your day!",
                        "Fabulous! Your spirit brings so much light to the world!",
                        "Outstanding! Keep spreading those good vibes!",
                        "Brilliant! Your joy is a gift to everyone around you!",
                        "Joyful! Your energy brightens even the cloudiest days!"
                    ];                    
                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                    console.log(randomMessage);
                }
            }
        });
    } else {
        console.error("Required elements not found in the DOM.");
    }
});


//fade in and out About section:
$(document).ready(function() {
    $('#ToggleAbouts').on('click', function() {
        $('#ViewAbout').fadeToggle(500); // 500ms duration for fade
    });
});


