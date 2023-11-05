$(document).ready(function () {
    // Add a scroll event listener to detect when the user scrolls
    $('#main-container').on('scroll', function () {
        if ($('#main-container').scrollTop() >= 200) {
            $('#myBtn').css("transform", "rotate(0deg)");
        } else {
            $('#myBtn').css("transform", "rotate(540deg)");
        }
    });

    // Add a click event listener to scroll back to the top when the arrow is clicked
    $('.upArrow').on('click', function () {
        scrollToTop();
    });

    // Function to scroll to the top
    function scrollToTop() {
        $('#main-container').scrollTop(0);
    }
});