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

console.log('Hello from this side! It\'s \ngreat to meet you. The console \nwill show you how many times \nyou\'ve scrolled!');
console.log('');
console.log('Every 5 times you scrolled, \nyou\'ll receive a delightful \nmessage from me!');
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
                if (numScrollAmount % 3 === 0) {
                    const messages = [
                        "Wow, you really enjoy this! \nI hope your day is going wonderfully!",
                        "This is fantastic! May your \nday shine as bright as you!",
                        "Spectacular! Your positivity \nis sure to inspire others!",
                        "Wonderful! May your day be \nfilled with joy and prosperity!",
                        "Amazing! Your enthusiasm is \ncontagious; keep it up!",
                        "Incredible! Each scroll adds \na little more joy to your day!",
                        "Fabulous! Your spirit brings so \nmuch light to the world!",
                        "Outstanding! Keep spreading \nthose good vibes!",
                        "Brilliant! Your joy is a gift \nto everyone around you!",
                        "Joyful! Your energy brightens \neven the cloudiest days!"
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


