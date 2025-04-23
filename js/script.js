
// Make orderData a global variable accessible to all functions
let orderData = {
    "data": {
        "bids": [
            ["5.30", 1, "5000000"],
            ["5.29", 2, "3500000"],
            ["5.28", 1, "2800000"],
            ["5.27", 3, "7500000"],
            ["5.26", 2, "4200000"]
        ],
        "asks": [
            ["5.40", 1, "10000000"],
            ["5.41", 2, "8500000"],
            ["5.42", 1, "3200000"],
            ["5.43", 2, "6700000"],
            ["5.44", 3, "9100000"]
        ],
        "highest_buy": "5.30",
        "lowest_sell": "5.40",
        "spread": "0.10"
    }
};

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM loaded, initializing orderbook");

    // Initialize the orderbook with sample data
    populateOrderbook(orderData);

    // Handle order type change
    const orderTypeSelect = document.getElementById('orderType');
    const priceInput = document.getElementById('price');

    if (orderTypeSelect && priceInput) {
        orderTypeSelect.addEventListener('change', function () {
            if (this.value === 'market') {
                priceInput.disabled = true;
                priceInput.placeholder = 'Market price';
                priceInput.value = '';
            } else {
                priceInput.disabled = false;
                priceInput.placeholder = 'Enter price';
            }
        });
    }

    // Handle send button click
    const sendButton = document.querySelector('.button');
    if (sendButton) {
        console.log("Send button found, adding event listener");
        sendButton.addEventListener('click', function () {
            console.log("Send button clicked");
            const quantity = document.getElementById('quantity').value;
            const price = document.getElementById('price').value;
            const orderType = document.getElementById('orderType').value;
            const direction = document.getElementById('direction').value;
            const token = document.getElementById('token').value;

            console.log(`Order details: ${orderType} ${direction} ${quantity} at ${price}`);

            // Validate inputs
            if (orderType === 'limit' && (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
                alert('Please enter a valid price for limit orders');
                return;
            }

            if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
                alert('Please enter a valid quantity');
                return;
            }

            // Add the order directly to the orderbook
            addOrderToOrderbook(orderType, direction, price, quantity);

            // Reset form
            document.getElementById('quantity').value = '';
            document.getElementById('price').value = '';

            alert('Order added to orderbook');
        });
    } else {
        console.error("Send button not found!");
    }
});

// Simplified function to add an order to the orderbook
function addOrderToOrderbook(orderType, direction, price, quantity) {
    console.log("Adding order to orderbook", orderType, direction, price, quantity);

    // Skip if it's a market order
    if (orderType === 'market') {
        console.log("Market orders not shown in orderbook");
        return;
    }

    // For limit orders, update the orderbook
    const numPrice = parseFloat(price).toFixed(2);
    const numQuantity = parseInt(quantity);

    if (direction === 'bid') {
        // Add to bids
        console.log("Adding bid order");

        // Check if this price level already exists
        let existingPrice = false;
        for (let i = 0; i < orderData.data.bids.length; i++) {
            if (orderData.data.bids[i][0] === numPrice) {
                // Update existing level
                orderData.data.bids[i][1] += 1; // Add 1 to order count
                const newVolume = parseInt(orderData.data.bids[i][2]) + numQuantity;
                orderData.data.bids[i][2] = newVolume.toString();
                existingPrice = true;
                console.log("Updated existing bid price level", numPrice);
                break;
            }
        }

        // If it's a new price level
        if (!existingPrice) {
            console.log("Adding new bid price level", numPrice);
            orderData.data.bids.push([numPrice, 1, numQuantity.toString()]);
            // Sort bids in descending order (highest first)
            orderData.data.bids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
        }

        // Update highest buy if needed
        if (parseFloat(numPrice) > parseFloat(orderData.data.highest_buy)) {
            orderData.data.highest_buy = numPrice;
        }
    } else {
        // Add to asks
        console.log("Adding ask order");

        // Check if this price level already exists
        let existingPrice = false;
        for (let i = 0; i < orderData.data.asks.length; i++) {
            if (orderData.data.asks[i][0] === numPrice) {
                // Update existing level
                orderData.data.asks[i][1] += 1; // Add 1 to order count
                const newVolume = parseInt(orderData.data.asks[i][2]) + numQuantity;
                orderData.data.asks[i][2] = newVolume.toString();
                existingPrice = true;
                console.log("Updated existing ask price level", numPrice);
                break;
            }
        }

        // If it's a new price level
        if (!existingPrice) {
            console.log("Adding new ask price level", numPrice);
            orderData.data.asks.push([numPrice, 1, numQuantity.toString()]);
            // Sort asks in ascending order (lowest first)
            orderData.data.asks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
        }

        // Update lowest sell if needed
        if (parseFloat(numPrice) < parseFloat(orderData.data.lowest_sell)) {
            orderData.data.lowest_sell = numPrice;
        }
    }

    // Recalculate spread
    orderData.data.spread = (parseFloat(orderData.data.lowest_sell) - parseFloat(orderData.data.highest_buy)).toFixed(2);

    // Update the display
    console.log("Updating orderbook display");
    populateOrderbook(orderData);
}

// Function to populate the orderbook
function populateOrderbook(data) {
    console.log("Populating orderbook with data");
    const bidsBody = document.getElementById('bids-body');
    const asksBody = document.getElementById('asks-body');
    const spreadValue = document.getElementById('spread-value');

    if (!bidsBody || !asksBody) {
        console.error("Could not find orderbook table bodies!");
        return;
    }

    // Clear existing data
    bidsBody.innerHTML = '';
    asksBody.innerHTML = '';

    // Populate bids
    data.data.bids.forEach(bid => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${parseFloat(bid[0]).toFixed(2)}</td>
            <td>${bid[1]}</td>
            <td>${parseInt(bid[2]).toLocaleString()}</td>
        `;
        bidsBody.appendChild(row);
    });

    // Populate asks
    data.data.asks.forEach(ask => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${parseFloat(ask[0]).toFixed(2)}</td>
            <td>${ask[1]}</td>
            <td>${parseInt(ask[2]).toLocaleString()}</td>
        `;
        asksBody.appendChild(row);
    });

    // Update spread
    if (spreadValue) {
        spreadValue.textContent = data.data.spread;
    }

    console.log("Orderbook population complete");
}