import { StargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

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
            <td>${(parseInt(bid[2])/10**6).toFixed(2)}</td>
        `;
        bidsBody.appendChild(row);
    });

    // Populate asks
    data.data.asks.forEach(ask => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${parseFloat(ask[0]).toFixed(2)}</td>
            <td>${ask[1]}</td>
            <td>${(parseInt(ask[2])/10**6).toFixed(2)}</td>
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
                    const balances = await fetchBalance(result.address)
                    if (balances.length == 0) {
                        balanceAmount.textContent = "NA"
                    } else {
                        balanceAmount.innerHTML = balances.map(coin => {
                            // Format each balance: convert from micro units and clean up the denom
                            const amount = (Number(coin.amount) / 10 ** 6).toFixed(6);
                            const denom = coin.denom.startsWith('u') ? coin.denom.substring(1).toUpperCase() : coin.denom;
                            return `${amount} ${denom}`;
                        }).join('<br>');
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
        orderButton.addEventListener('click', async function() {
            try {
                const quantity = document.getElementById('quantity').value;
                const price = document.getElementById('price').value;
                const orderType = document.getElementById('orderType').value; // 'limit' or 'market'
                const direction = document.getElementById('direction').value; // 'buy' or 'sell'
                const token = document.getElementById('token').value; // The token symbol

                console.log(orderType, "orderType");
                console.log(direction, "direction");

                // Validate inputs
                if (!quantity || (orderType === 'limit' && !price)) {
                    alert('Please fill out all required fields');
                    return;
                }

                // Show loading state
                this.disabled = true;
                this.innerHTML = 'Processing...';

                // Convert form values to contract parameters
                // Map 'buy' to 'bid' and 'sell' to 'ask' for the category parameter
                const category = direction === 'bid' ? 'bid' : 'ask';
                // Use token as asset, ensure it has 'u' prefix if needed
                const asset = token.startsWith('u') ? token : `u${token.toLowerCase()}`;
                // Format quantity (convert to appropriate units if needed)
                const formattedQuantity = quantity * 1000000 + ''; // Convert to microtokens and to string

                // Generate a wallet if not already available
                let wallet_result = await main();
                let currentWallet = wallet_result.wallet;
                // if (localStorage.getItem("wallet")) {
                //     currentWallet = gene
                // } else {
                //     const { wallet } = await generateKey();
                //     window.currentWallet = wallet;
                //     currentWallet = wallet;
                // }

                console.log('Preparing to submit order with the following parameters:');
                console.log({
                    quantity: formattedQuantity,
                    asset: asset,
                    category: category,
                    limit: price,
                    execution: orderType
                });

                // Send the transaction to the blockchain
                const result = await placeOrder(
                    currentWallet,
                    formattedQuantity,
                    asset,
                    category,
                    price,
                    orderType
                );

                console.log('Transaction successful:', result);

                // Show success message
                alert(`Order successfully placed! Transaction hash: ${result.transactionHash}`);

                // Reset form
                document.getElementById('quantity').value = '';
                document.getElementById('price').value = '';

            } catch (error) {
                console.error('Error processing order:', error);
                alert(`Failed to place order: ${error.message}`);
            } finally {
                // Reset button state
                this.disabled = false;
                this.innerHTML = 'Place Order';
            }
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
            amount: [{ denom: "uom", amount: "500000" }],
            gas: "500000"
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
