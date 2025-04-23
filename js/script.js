// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Select all buttons
    const buttons = document.querySelectorAll('.button');

    // Add click event listeners to all buttons
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            alert('You clicked: ' + this.textContent);
        });
    });

    // Get input field from first box
    const inputField = document.querySelector('.input-field[type="text"]');

    // Add event listener for input changes
    if (inputField) {
        inputField.addEventListener('input', function() {
            console.log('Input value: ' + this.value);
        });
    }
});
