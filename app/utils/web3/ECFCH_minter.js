// CarbonHub's European Carbon Credits for Carbon Trading

const web3 = require('@solana/web3.js');
const spl = require('@solana/spl-token');
const { createCreateMetadataAccountV3Instruction } = require('@metaplex-foundation/mpl-token-metadata');
const fs = require('fs');
const bs58 = require('bs58');

// Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Helper to try multiple RPC URLs
async function getWorkingSolanaConnection(urls) {
    let rpcUrlIdx = 0;
    while (rpcUrlIdx < urls.length) {
        try {
            const connection = new web3.Connection(urls[rpcUrlIdx], 'confirmed');
            // Try a simple call to check if the connection works
            await connection.getEpochInfo();
            return connection;
        } catch (e) {
            console.log(`Failed to connect to RPC URL: ${urls[rpcUrlIdx]}, trying next...`);
            rpcUrlIdx++;
        }
    }
    throw new Error('No working Solana RPC URL found');
}

// Helper function to find metadata PDA
function findMetadataPda(mint) {
    return web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    )[0];
}

const create = async () => {
    try {
        // Load RPC URLs from env
        const SOLANA_DEVNET_RPC = JSON.parse(process.env.DEVNET_RPC_URLS);
        const SOLANA_MAINNET_RPC = JSON.parse(process.env.MAINNET_RPC_URLS);
        const RPC_URL_LIST = process.env.SOLANA_NETWORK === "devnet" ? SOLANA_DEVNET_RPC : SOLANA_MAINNET_RPC;
        // Try each RPC URL in order
        const connection = await getWorkingSolanaConnection(RPC_URL_LIST);

        // Load the Solana private key from env (base58 format) - this is the account with SOL
        const privateKeyString = process.env.SOLANA_PRIVATE_KEY;
        if (!privateKeyString) throw new Error('Missing SOLANA_PRIVATE_KEY in environment variables');
        const secretKey = bs58.default.decode(privateKeyString);
        const payer = web3.Keypair.fromSecretKey(secretKey);

        // Generate a new keypair for the mint account
        const mintAccount = web3.Keypair.generate();

        // Save the mint account keypair to a file (for debug)
        fs.writeFileSync('token-keypair.json', JSON.stringify({
            publicKey: mintAccount.publicKey.toString(),
            privateKey: bs58.default.encode(mintAccount.secretKey)
        }));

        // Get minimum lamports required for rent exemption
        const lamports = await spl.getMinimumBalanceForRentExemptMint(connection);

        // Create the token mint
        const createMintTransaction = new web3.Transaction().add(
            web3.SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: mintAccount.publicKey,
                space: spl.MINT_SIZE,
                lamports,
                programId: spl.TOKEN_PROGRAM_ID,
            }),
            spl.createInitializeMintInstruction(
                mintAccount.publicKey,
                3, // 3 decimals
                payer.publicKey, // mint authority
                payer.publicKey, // freeze authority
                spl.TOKEN_PROGRAM_ID
            )
        );

        // Send and confirm transaction
        const signature = await web3.sendAndConfirmTransaction(
            connection,
            createMintTransaction,
            [payer, mintAccount]
        );

        // Create metadata account
        const metadataPda = findMetadataPda(mintAccount.publicKey);
        const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
            {
                metadata: metadataPda,
                mint: mintAccount.publicKey,
                mintAuthority: payer.publicKey,
                payer: payer.publicKey,
                updateAuthority: payer.publicKey,
            },
            {
                createMetadataAccountArgsV3: {
                    data: {
                        name: "ECFCH",
                        symbol: "ECFCH",
                        uri: "https://cdn.carbonhub.app/metadata.json",
                        sellerFeeBasisPoints: 0,
                        creators: null,
                        collection: null,
                        uses: null,
                    },
                    isMutable: true,
                    collectionDetails: null,
                },
            }
        );

        // Send and confirm metadata transaction
        const metadataSignature = await web3.sendAndConfirmTransaction(
            connection,
            new web3.Transaction().add(createMetadataInstruction),
            [payer]
        );

        console.log('Token created successfully!');
        console.log('Token Public Key:', mintAccount.publicKey.toString());
        console.log('Token Private Key:', bs58.default.encode(mintAccount.secretKey));
        console.log('Transaction Signature:', signature);
        console.log('Metadata PDA:', metadataPda.toString());
        console.log('Metadata Transaction Signature:', metadataSignature);

        return {
            publicKey: mintAccount.publicKey.toString(),
            privateKey: bs58.default.encode(mintAccount.secretKey),
            signature,
            metadataPda: metadataPda.toString(),
            metadataSignature
        };
    } catch (error) {
        console.error('Error creating token:', error);
        throw error;
    }
}

const mint = async (targetPublicKey, amount) => {
    try {
        console.log('Starting mint process...');
        console.log('Target Public Key:', targetPublicKey);
        console.log('Amount:', amount);

        // Load RPC URLs from env
        console.log('Loading RPC URLs...');
        const SOLANA_DEVNET_RPC = JSON.parse(process.env.DEVNET_RPC_URLS);
        const SOLANA_MAINNET_RPC = JSON.parse(process.env.MAINNET_RPC_URLS);
        const RPC_URL_LIST = process.env.SOLANA_NETWORK === "devnet" ? SOLANA_DEVNET_RPC : SOLANA_MAINNET_RPC;
        console.log('Using network:', process.env.SOLANA_NETWORK);
        
        // Try each RPC URL in order
        console.log('Establishing connection...');
        const connection = await getWorkingSolanaConnection(RPC_URL_LIST);
        console.log('Connection established successfully');

        // Load the Solana authority private key from env (base58 format) - for paying fees and minting
        console.log('Loading Solana authority...');
        const solanaPrivateKeyString = process.env.SOLANA_PRIVATE_KEY;
        if (!solanaPrivateKeyString) throw new Error('Missing SOLANA_PRIVATE_KEY in environment variables');
        const solanaSecretKey = bs58.default.decode(solanaPrivateKeyString);
        const payer = web3.Keypair.fromSecretKey(solanaSecretKey);
        console.log('Solana authority loaded:', payer.publicKey.toBase58());

        // Get the token public key from env
        console.log('Loading token public key...');
        const mintPublicKey = new web3.PublicKey(process.env.ECFCH_PUBLIC_KEY);
        if (!mintPublicKey) throw new Error('Missing TOKEN_PUBLIC_KEY in environment variables');
        console.log('Token public key loaded:', mintPublicKey.toBase58());

        // Verify mint account info
        console.log('Verifying mint account info...');
        try {
            const mintInfo = await spl.getMint(connection, mintPublicKey);
            console.log('Mint Authority:', mintInfo.mintAuthority?.toBase58());
            console.log('Payer Public Key:', payer.publicKey.toBase58());
            console.log('Decimals:', mintInfo.decimals);
            console.log('Supply:', mintInfo.supply.toString());
            
            if (!mintInfo.mintAuthority) {
                throw new Error('Token has no mint authority set');
            }

            if (!mintInfo.mintAuthority.equals(payer.publicKey)) {
                throw new Error(`Mint authority mismatch. Expected: ${payer.publicKey.toBase58()}, Got: ${mintInfo.mintAuthority.toBase58()}`);
            }
        } catch (error) {
            console.error('Error verifying mint account:', error);
            throw error;
        }

        // Validate target public key
        console.log('Validating target public key...');
        let targetPubKey;
        try {
            targetPubKey = new web3.PublicKey(targetPublicKey);
            console.log('Target public key validated:', targetPubKey.toBase58());
        } catch (error) {
            throw new Error('Invalid target public key format');
        }

        // Validate amount
        console.log('Validating amount...');
        if (typeof amount !== 'number' || amount <= 0) {
            throw new Error('Amount must be a positive number');
        }
        console.log('Amount validated:', amount);

        console.log('Creating or getting associated token account...');
        // Get the associated token account for the target
        const associatedTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
            connection,
            payer, // Use payer for creating the associated token account
            mintPublicKey,
            targetPubKey
        );
        console.log('Associated token account:', associatedTokenAccount.address.toBase58());

        console.log('Preparing mint transaction...');
        // Mint tokens to the target
        const mintToTransaction = new web3.Transaction().add(
            spl.createMintToInstruction(
                mintPublicKey,
                associatedTokenAccount.address,
                payer.publicKey, // Use payer as mint authority since that's what was set during creation
                amount // Amount is already in the smallest unit
            )
        );

        console.log('Sending transaction...');
        // Send and confirm transaction
        const signature = await web3.sendAndConfirmTransaction(
            connection,
            mintToTransaction,
            [payer] // Only payer needs to sign since it's both the payer and mint authority
        );

        console.log('ECFCH tokens minted successfully!');
        console.log('Token Public Key:', process.env.ECFCH_PUBLIC_KEY);
        console.log('Token Metadata PDA:', process.env.ECFCH_METADATA_PDA);
        console.log('Target Public Key:', targetPublicKey);
        console.log('Amount Minted:', amount);
        console.log('Associated Token Account:', associatedTokenAccount.address.toString());
        console.log('Transaction Signature:', signature);

        return {
            tokenPublicKey: process.env.ECFCH_PUBLIC_KEY,
            tokenMetadataPda: process.env.ECFCH_METADATA_PDA,
            targetPublicKey,
            amount,
            associatedTokenAccount: associatedTokenAccount.address.toString(),
            signature
        };
    } catch (error) {
        console.error('Error minting ECFCH tokens:', error);
        if (error.logs) {
            console.error('Transaction logs:', error.logs);
        }
        throw error;
    }
}

module.exports = {
    create,
    mint
}