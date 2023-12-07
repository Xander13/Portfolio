 //Clock function
 setInterval(showTime, 1000);
 // Defining showTime funcion
 function showTime() {
     // Getting current time and date
     let time = new Date();
     let hour = time.getHours();
     let min = time.getMinutes();
     am_pm = " AM ";

     // Setting time for 12 Hrs format
     if (hour >= 12) {
         if (hour > 12) hour -= 12;
         am_pm = " PM ";
     } else if (hour == 0) {
         hr = 12;
         am_pm = " AM ";
     }

     hour = hour < 10 ? "0" + hour : hour;
     min = min < 10 ? "0" + min : min;

     let currentTime =
         hour +
         ":" +
         min +
         am_pm;

     // Displaying the time
     document.getElementById(
         "clock"
     ).innerHTML = currentTime;
 }
 showTime();