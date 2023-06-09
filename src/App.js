import React, { useState } from 'react'
import { Connection,clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import {Token,TOKEN_PROGRAM_ID} from "@solana/spl-token";


function App() { 
    const [walletConnected, setWalletConnected] = useState(false); 
    const [provider, setProvider] = useState(); 
    const [loading, setLoading] = useState(); 

    const getProvider = async () => {
        if ("solana" in window) {
        const provider = window.solana;
        if (provider.isPhantom) {
            return provider;
        }
        } else {
        window.open("https://www.phantom.app/", "_blank");
        }
    };
    
    const walletConnectionHelper = async () => {
        if (walletConnected){
        setProvider();
        setWalletConnected(false);
        } else {
        const userWallet = await getProvider();
        if (userWallet) {
            await userWallet.connect();
            userWallet.on("connect", async () => {
                setProvider(userWallet);
                setWalletConnected(true);
            });
        }
        }
    }

    const airDropSolana = async () => {
        try {
            setLoading(true);
            const connection = new Connection(
                clusterApiUrl("devnet"),
                "confirmed"
            );
            const fromAirDropSignature = await connection.requestAirdrop(new PublicKey(provider.publicKey), LAMPORTS_PER_SOL);
            await connection.confirmTransaction(fromAirDropSignature, { commitment: "confirmed" });
            
            console.log(`1 SOL airdropped to your wallet successfully`);
            setLoading(false);
        } catch(err) {
            console.log(err);
            setLoading(false);
        }
     }



    const [isTokenCreated,setIsTokenCreated] = useState(false);
    const [createdTokenPublicKey,setCreatedTokenPublicKey] = useState(null);
    const [mintingWalletSecretKey,setMintingWalletSecretKey] = useState(null);

    const tokencreator = async () => {
    try {
        setLoading(true);
        const connection = new Connection(
            clusterApiUrl("devnet"),
            "confirmed"
        );
        
        const mintRequester = await provider.publicKey;
        const mintingFromWallet = await Keypair.generate();
        setMintingWalletSecretKey(JSON.stringify(mintingFromWallet.secretKey));
        
        const fromAirDropSignature = await connection.requestAirdrop(mintingFromWallet.publicKey, LAMPORTS_PER_SOL);
        await connection.confirmTransaction(fromAirDropSignature, { commitment: "confirmed" });//sol for token creation
        
        const creatorToken = await Token.createMint(connection, mintingFromWallet, mintingFromWallet.publicKey, null, 6, TOKEN_PROGRAM_ID);
        const fromTokenAccount = await creatorToken.getOrCreateAssociatedAccountInfo(mintingFromWallet.publicKey);
        await creatorToken.mintTo(fromTokenAccount.address, mintingFromWallet.publicKey, [], 1000000);
        
        const toTokenAccount = await creatorToken.getOrCreateAssociatedAccountInfo(mintRequester);
        const transaction = new Transaction().add(
            Token.createTransferInstruction(
                TOKEN_PROGRAM_ID,
                fromTokenAccount.address,
                toTokenAccount.address,
                mintingFromWallet.publicKey,
                [],
                1000000
            )
        );
        const signature=await sendAndConfirmTransaction(connection, transaction, [mintingFromWallet], { commitment: "confirmed" });
        
        console.log("Transanction signature:",signature);
        
        setCreatedTokenPublicKey(creatorToken.publicKey);
        setIsTokenCreated(true);
        setLoading(false);
    } catch(err) {
        console.log(err)
        setLoading(false);
    }
    }

    const [supplyCapped,setSupplyCapped]=useState(false)	
   
    


     const transferTokenHelper = async () => {
        try {
           setLoading(true);
           
           const connection = new Connection(
              clusterApiUrl("devnet"),
              "confirmed"
           );
           
           const createMintingWallet = Keypair.fromSecretKey(Uint8Array.from(Object.values(JSON.parse(mintingWalletSecretKey))));
           const receiverWallet = new PublicKey("BfUQj1yitL3yuox3etkN86gExWV4tpb8PkhPpdwNXaB6");//solflare wallet of mine
           
           const fromAirDropSignature = await connection.requestAirdrop(createMintingWallet.publicKey, LAMPORTS_PER_SOL);
           await connection.confirmTransaction(fromAirDropSignature, { commitment: "confirmed" });
           console.log('1 SOL airdropped to the wallet for fee');
           
           const creatorToken = new Token(connection, createdTokenPublicKey, TOKEN_PROGRAM_ID, createMintingWallet);
           const fromTokenAccount = await creatorToken.getOrCreateAssociatedAccountInfo(provider.publicKey);
           const toTokenAccount = await creatorToken.getOrCreateAssociatedAccountInfo(receiverWallet);
           
           const transaction = new Transaction().add(
              Token.createTransferInstruction(TOKEN_PROGRAM_ID, fromTokenAccount.address, toTokenAccount.address, provider.publicKey, [], 10000000)
           );
           transaction.feePayer=provider.publicKey;
           let blockhashObj = await connection.getRecentBlockhash();
           console.log("blockhashObj", blockhashObj);
           transaction.recentBlockhash = await blockhashObj.blockhash;
     
           if (transaction) {
              console.log("Success");
           }
           
           let signed = await provider.signTransaction(transaction);
           let signature = await connection.sendRawTransaction(signed.serialize());
           await connection.confirmTransaction(signature);
           
           console.log("SIGNATURE: ", signature);
           setLoading(false);
        } catch(err) {
           console.log(err)
           setLoading(false);
        }
     }
    
     
     const headingstyle = {
        color: "white",
        padding: "50px",
        fontFamily: "Arial",
        textAlign: "center",

      };
      const pubkeystyle = {
        color: "yellow",
        //backgroundColor: "skyblue",
        padding: "10px",
        fontFamily: "Arial"
      };

      const listyle ={
         color: "white",
         padding: "10px",
      };

      const buttonstyle = {
        backgroundColor: "",
        padding: "20px", 
        position: "center",
      }
     
      const libuttons ={
        padding: "10px",
      }

    return (        
        <div>
            <div>
                <h1 style={headingstyle}>SOLTOK</h1>
            </div>

            <button style={buttonstyle} onClick={walletConnectionHelper} disabled={loading}>
                {!walletConnected?"Connect Wallet":"Disconnect Wallet"}
            </button> 

            {
            walletConnected ? (
                <p>
                    <h2>
                <li style={listyle}>
                    Airdrop 1 SOL :
                <button style={libuttons} disabled={loading}  onClick={airDropSolana}> AirDrop SOL </button>
                </li>

                <li style={listyle}>Create a token :
                <button disabled={loading} style={libuttons} onClick={tokencreator}>Initial Mint </button>
                </li>

                <li style={listyle}>Transfer Tokens : 
                <button style = {libuttons} disabled={loading} onClick={transferTokenHelper}>Transfer 10 Tokens</button>
                </li>

                
                </h2>

                </p>):<></>
            }
             <footer>
             <div>
            <h3 style= {pubkeystyle}>
                {walletConnected?(<p><strong> Your Phantom Wallet address:</strong> {provider.publicKey.toString()}</p>):<p></p>}
             </h3>
            </div>
             </footer>
            

        </div>
    )
};

export default App;
