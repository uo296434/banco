import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import detectEthereumProvider from "@metamask/detect-provider";
import {Contract, ethers} from "ethers";
import { useState, useEffect, useRef } from 'react';
import bankManifest from "./contracts/Bank.json";
import { decodeError } from 'ethers-decode-error'


function App(){
  const bank = useRef(null);
  const [clientBalance, setClientBalance] = useState(0);
  const [interest, setInterest] = useState(0);  
  const [clientBalance2, setClientBalance2] = useState(0);
  const [interest2, setInterest2] = useState(0);
  const [tokensToBuy, setTokensToBuy] = useState(''); 
  const [BNBsFromTokenSales, setBNBsFromTokenSales] = useState(0);

  useEffect( () => {
    initContracts();
  }, [])

  let initContracts = async () => {
    await getBlockchain();
    await updateBalanceBNB();
    await updateInterest();
    await updateBalanceBNB2();
    await updateInterest2();
    await fetchTotalBNBFromTokenSales();
  }

  let getBlockchain = async () => {
    let provider = await detectEthereumProvider();
    if(provider) {
      await provider.request({ method: 'eth_requestAccounts' });
      const networkId = await provider.request({ method: 'net_version' })

      provider = new ethers.providers.Web3Provider(provider);
      const signer = provider.getSigner();

      bank.current = new Contract(
        bankManifest.networks[networkId].address,
        bankManifest.abi,
        signer
      );

    }
    return null;
  }

  let updateBalanceBNB = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
          const balanceBNB = await bank.current.getClientBalanceBNB(accounts[0]);
          setClientBalance(balanceBNB.toString());
      }
    } catch (error) {
      alert("Error al obtener el deposito del cliente.");
    }
  }

  let updateInterest = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
          const balanceBNB = await bank.current.getClientInterest(accounts[0]);
          setInterest(balanceBNB.toString());
      }
    } catch (error) {
      alert("Error al obtener el interés del cliente.");
    }
  }

  let updateBalanceBNB2 = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
          const balanceBNB = await bank.current.getClientBalanceBNB2(accounts[0]);
          setClientBalance2(balanceBNB.toString());
      }
    } catch (error) {
      alert("Error al obtener el deposito del cliente.");
    }
  }

  let updateInterest2 = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
          const balanceBNB = await bank.current.getClientInterest2(accounts[0]);
          setInterest2(balanceBNB.toString());
      }
    } catch (error) {
      alert("Error al obtener el interés del cliente.");
    }
  }
  
  let onSubmitDeposit = async (e) => {
    e.preventDefault();

    const BNBamount = parseFloat(e.target.elements[0].value);

    // Wei to BNB se pasa con ethers.utils recibe un String!!!
    const tx = await bank.current.deposit({
      value: ethers.utils.parseEther(String(BNBamount)),
      gasLimit: 6721975,
      gasPrice: 20000000000,
    });

    await tx.wait();

    await updateBalanceBNB();
    await updateInterest();
  }

  let onSubmitDeposit2 = async (e) => {
    e.preventDefault();

    const BNBamount = parseFloat(e.target.elements[0].value);

    // Wei to BNB se pasa con ethers.utils recibe un String!!!
    const tx = await bank.current.secondDeposit({
      value: ethers.utils.parseEther(String(BNBamount)),
      gasLimit: 6721975,
      gasPrice: 20000000000,
    });

    await tx.wait();

    await updateBalanceBNB2();
    await updateInterest2();
  }

  let clickWithdraw = async (e) => {
    const withdrawalFee = '0.05'; 
    const tx = await bank.current.withdraw({
      value: ethers.utils.parseEther(withdrawalFee),
      gasLimit: 6721975,
      gasPrice: 20000000000,
    })     
    try{
      await tx.wait();
    } catch (error) { 
      const errorDecoded  = decodeError(error)
      alert('Revert reason:', errorDecoded.error)
    } 

    await updateBalanceBNB();
    await updateInterest();
  }

  let clickWithdraw2 = async (e) => {
    const withdrawalFee = '0.05'; 
    const tx = await bank.current.secondWithdraw({
      value: ethers.utils.parseEther(withdrawalFee),
      gasLimit: 6721975,
      gasPrice: 20000000000,
    })     
    try{
      await tx.wait();
    } catch (error) { 
      const errorDecoded  = decodeError(error)
      console.log('Revert reason:', errorDecoded.error)
    } 

    await updateBalanceBNB2();
    await updateInterest2();
  }

  let fetchTotalBNBFromTokenSales = async () => {
    try {
      const totalBNB = await bank.current.getTotalBNBFromTokenSales();
      const BNB = totalBNB.toNumber();
      setBNBsFromTokenSales(BNB);
    } catch (error) {
      alert('Error fetching total BNB from token sales');
    }
  };

  let onSubmitBuyTokens = async (e) => {
    e.preventDefault();

    try {
      const tokens = parseFloat(tokensToBuy);

      if (isNaN(tokens) || tokens <= 0) {
        alert('Please enter a valid number of tokens.');
        return;
      }

      const tx = await bank.current.buyTokens(tokens, {
        value: ethers.utils.parseEther(String(tokens * 0.001)),
        gasLimit: 6721975,
        gasPrice: 20000000000,
      });
      try{
        await tx.wait();
      } catch (error) { 
        const errorDecoded  = decodeError(error)
        alert('Revert reason:', errorDecoded.error)
      } 

      await fetchTotalBNBFromTokenSales();
    } catch (error) {
      console.error('Error buying tokens:', error);
      alert('Error buying tokens. Please try again.');
    }
  }


  return (
    <div>
      <h1>Bank</h1>
      <h3>First Deposit</h3>
      <form onSubmit= { (e) => onSubmitDeposit(e) } >
        <input type="number" step="0.01" />
        <button type="submit">Deposit</button>
      </form>
      <button onClick= { () => clickWithdraw() }> Withdraw </button>
      <br /><br />
      <p>Balance BNB: {clientBalance}</p>
      <p>Interest: {interest}</p>
      <br/>
      <h3>Second Deposit</h3>
      <form onSubmit= { (e) => onSubmitDeposit2(e) } >
        <input type="number" step="0.01" />
        <button type="submit">Deposit</button>
      </form>
      <button onClick= { () => clickWithdraw2() }> Withdraw </button>
      <br /><br />
      <p>Balance BNB: {clientBalance2}</p>
      <p>Interest: {interest2}</p>
      <br/>
      <h4>BMIW purchase</h4>
      <form onSubmit={onSubmitBuyTokens}>
        <label>
          Tokens to Buy:
          <input
            type="number"
            step="1"
            value={tokensToBuy}
            onChange={(e) => setTokensToBuy(e.target.value)}
          />
        </label>
        <button type="submit">Buy Tokens</button>
        <p>Total BNB from Token Sales: {BNBsFromTokenSales}</p>
      </form>
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);