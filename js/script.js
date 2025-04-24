// Global variables
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

// Function to populate the orderbook
function populateOrderbook(data) {
    const bidsBody = document.getElementById('bids-body');
    const asksBody = document.getElementById('asks-body');
    const spreadValue = document.getElementById('spread-value');

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
    spreadValue.textContent = data.data.spread;
}

// Function to fetch orderbook data from local Cosmos chain
async function fetchOrderbookData() {
    try {
        // Configuration - update these values with your specific chain details
        const rpcUrl = 'http://localhost:26657'; // Default Tendermint RPC port
        const restUrl = 'http://localhost:1317';  // Default Cosmos REST API port
        const contractAddress = 'mantra14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9st5uxgc'; // Replace with your contract address
        
        // Query message for the contract
        const queryMsg = {
            "orderbook_snapshot": {}
        };
        
        // Encode the query message to base64
        const encodedQuery = btoa(JSON.stringify(queryMsg));
        
        // Construct the API endpoint
        const endpoint = `${restUrl}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${encodedQuery}`;
        
        // Fetch data from the local chain
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Check if response has the expected format
        if (result && result.data) {
            // Update orderbook with fetched data
            populateOrderbook(result);
        } else {
            console.error('Unexpected response format:', result);
            // Use fallback data
            populateOrderbook(orderData);
        }
    } catch (error) {
        console.error('Error fetching orderbook data:', error);
        // Use fallback data in case of error
        populateOrderbook(orderData);
    }
}

// Initialize event handlers
document.addEventListener('DOMContentLoaded', function() {
    // Fetch initial orderbook data
    fetchOrderbookData();
    
    // Set up periodic polling to refresh the orderbook
    setInterval(fetchOrderbookData, 5000); // Update every 5 seconds
    
    // Place Order button click handler
    const orderButton = document.querySelector('.button-row .button');
    if (orderButton) {
        orderButton.addEventListener('click', function() {
            const quantity = document.getElementById('quantity').value;
            const price = document.getElementById('price').value;
            const orderType = document.getElementById('orderType').value;
            const direction = document.getElementById('direction').value;
            const token = document.getElementById('token').value;
            
            // Validate inputs
            if (!quantity || !price || (orderType === 'limit' && !price)) {
                alert('Please fill out all required fields');
                return;
            }
            
            // In a real application, this would call a function to execute the order
            console.log('Order submitted:', {
                quantity,
                price,
                orderType,
                direction,
                token
            });
            
            // For demonstration purposes
            alert(`Order submitted: ${direction} ${quantity} ${token} at ${price} (${orderType})`);
        });
    }
    
    // Disable price input when "Market" order type is selected
    const orderTypeSelect = document.getElementById('orderType');
    if (orderTypeSelect) {
        orderTypeSelect.addEventListener('change', function() {
            const priceInput = document.getElementById('price');
            if (this.value === 'market') {
                priceInput.disabled = true;
                priceInput.placeholder = 'N/A for Market orders';
            } else {
                priceInput.disabled = false;
                priceInput.placeholder = 'Enter price';
            }
        });
    }
});
