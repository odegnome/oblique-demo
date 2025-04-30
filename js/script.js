import { StargateClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
// import { stringToPath } from "@cosmjs/crypto";

const rpc = "http://localhost:26657"
// const rpc = "https://rpc.dukong.mantrachain.io"
const restUrl = 'http://localhost:1317';  // Default Cosmos REST API port
const contractAddress = 'mantra14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9st5uxgc'; // Replace with your contract address

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
        // const rpcUrl = 'http://localhost:26657'; // Default Tendermint RPC port

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

    // Add wallet generation button handler
    const generateWalletButton = document.getElementById('generate-wallet');
    const balanceAmount = document.getElementById('balance-amount');
    if (generateWalletButton) {
        generateWalletButton.addEventListener('click', async function() {
            const resultDiv = document.getElementById('wallet-result');
            if (resultDiv) {
                // Show the result div
                resultDiv.classList.add('active');
                resultDiv.innerHTML = "<p>Generating wallet and fetching balance...</p>";

                try {
                    const result = await main();
                    const balance = await fetchBalance(result.address)
                    if (balance.length == 0) {
                        balanceAmount.textContent = "0.00"
                    } else {
                        balanceAmount.textContent = ((Number(balance[0].amount).toFixed(2)) / 10 ** 6).toString() + balance[0].denom // 100USDC
                    }
                    resultDiv.innerHTML = `
                        <p><strong>Generated Address:</strong> ${result.address}</p>
                        <p><strong>Mnemonic:</strong> ${result.wallet.mnemonic}</p>
                        <p>Balance information has been logged to the console.</p>
                    `;
                } catch (error) {
                    resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
                }
            }
        });
    }

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

// Function to generate a new wallet
const generateKey = async () => {
    const wallet = await DirectSecp256k1HdWallet.generate(24, { prefix: "mantra" });
    console.log(wallet, "wallet");
    console.log("Generated mnemonic:", wallet.mnemonic);
    const accounts = await wallet.getAccounts();
    const address = accounts[0].address;
    localStorage.setItem("address", address);
    localStorage.setItem("wallet", JSON.stringify(wallet));
    console.log("Generated address:", address);
    return { wallet, address };
}

// Function to fetch balance for an address
async function fetchBalance(address) {
    try {
        const client = await StargateClient.connect(rpc);
        // console.log("Connected to chain ID:", await client.getChainId());
        // console.log("Current height:", await client.getHeight());

        const balances = await client.getAllBalances(address);
        console.log("Balances for", address, ":", balances);

        return balances;
    } catch (error) {
        console.error("Error fetching balance:", error);
        return [];
    }
}

// Main function to generate wallet and fetch balance
async function main() {
    try {
        // Generate a new wallet
        console.log("Generating new wallet...");
        var old_address = localStorage.getItem("address");
        var old_wallet = JSON.parse(localStorage.getItem("wallet"));

        if (!old_address || !old_wallet) {
            const { wallet, address } = await generateKey();
            return { wallet, address };
        }

        const wallet = await getKey(old_wallet?.secret?.data);
        const accounts = await wallet.getAccounts();
        const address = accounts[0].address;
        console.log(wallet, "wallet 3");
        console.log(address, "address 3");

        return { wallet, address };
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

async function getKey(mnemonic) {
    if (!mnemonic) {
        let { wallet, } = await generateKey()
        return wallet
    }
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "mantra" })
    return wallet
}

async function placeOrder(wallet, quantity, asset, category, limit, execution) {
    try {
        // Create a signing client with the wallet
        const { SigningCosmWasmClient } = await import("@cosmjs/cosmwasm-stargate");
        const client = await SigningCosmWasmClient.connectWithSigner(rpc, wallet);

        // Get the account address
        const accounts = await wallet.getAccounts();
        const sender = accounts[0].address;

        console.log("Placing order as:", sender);

        // Prepare the message for the contract
        const msg = {
            place_order: {
                quantity: quantity,
                asset: asset,
                category: category,
                limit: limit,
                execution: execution
            }
        };

        console.log("Transaction message:", JSON.stringify(msg));

        // Calculate the funds to send with the transaction based on order type
        let funds = [];

        if (category === 'bid') {
            // For buy orders, send USDC equal to quantity * limit
            const usdcAmount = Math.ceil(parseFloat(quantity) * parseFloat(limit)).toString();
            funds = [{ denom: "uusdc", amount: usdcAmount }];
            console.log("Sending funds with buy order:", funds);
        } else if (category === 'ask') {
            // For sell orders, send the asset being sold (quantity)
            funds = [{ denom: asset, amount: quantity }];
            console.log("Sending funds with sell order:", funds);
        }

        // Execute the contract with the message
        const fee = {
            amount: [{ denom: "umantra", amount: "5000" }],
            gas: "200000"
        };

        // Send the transaction
        const result = await client.execute(
            sender,
            contractAddress,
            msg,
            fee,
            "", // memo
            funds,
        );

        console.log("Transaction result:", result);
        console.log("Transaction hash:", result.transactionHash);

        return result;
    } catch (error) {
        console.error("Error placing order:", error);
        throw error;
    }
}
