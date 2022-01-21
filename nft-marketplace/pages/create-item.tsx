import { ethers } from "ethers";
import { useState, useEffect, ChangeEvent } from "react";
import { create as ipfsHttpClient } from "ipfs-http-client";
import axios from "axios";
import Web3Modal from "web3modal";
import { nftAddress, nftMarketAddress } from "../.config";

// ABI's
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/Market.sol/NFTMarket.json";
import { useRouter } from "next/router";

const ipfsClient = ipfsHttpClient({
  url: "https://ipfs.infura.io:5001/api/v0",
});

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });
  const router = useRouter();

  const createMarketItem = async () => {
    // Sanity checks
    if (
      !formInput.name ||
      !formInput.description ||
      !formInput.price ||
      !fileUrl
    )
      return;
    try {
      const fileObject = {
        name: formInput.name,
        description: formInput.description,
        image: fileUrl,
      };
      const addedIpfsFileObject = await ipfsClient.add(
        JSON.stringify(fileObject)
      );
      console.log("ADDED FILE OBJECT : ", addedIpfsFileObject);
      await createSale(
        `https://ipfs.infura.io/ipfs/${addedIpfsFileObject.path}`
      );
    } catch (error) {}
  };

  const createSale = async (url: string) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    console.log("CREATING SALE : ");
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const nftContract = new ethers.Contract(nftAddress, NFT.abi, signer);
    const transaction = await nftContract.createToken(url);
    // Waiting for the transaction to complete
    const tx = await transaction.wait();
    //Each signed transaction result has the associated events details in the response
    // Another way is to subscribe to these events on the frontend
    let event = tx.events[0];
    let value = event.args[2];
    let tokenId = value.toNumber();

    const nftMarketContract = new ethers.Contract(
      nftMarketAddress,
      Market.abi,
      signer
    );
    let listingPrice = await nftMarketContract.getListingPrice();
    listingPrice = listingPrice.toString();
    const price = ethers.utils.parseUnits(formInput.price, "ether");
    const marketTransaction = await nftMarketContract.createMarketItem(
      nftAddress,
      tokenId,
      price,
      { value: listingPrice }
    );
    await marketTransaction.wait();
    router.push("/");
  };

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files === null) return;
    const file = e.target.files[0];
    try {
      const fileAdded = await ipfsClient.add(file, {
        progress: (_progress) => console.log("Recived ", _progress, "bytes"),
      });
      console.log("File added : ", fileAdded);
      setFileUrl(`https://ipfs.infura.io/ipfs/${fileAdded.path}`);
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, name: e.target.value })
          }
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, description: e.target.value })
          }
        />
        <input
          placeholder="Asset Price in Eth"
          className="mt-2 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, price: e.target.value })
          }
        />
        <input type="file" name="Asset" className="my-4" onChange={onChange} />
        {fileUrl && <img className="rounded mt-4" width="350" src={fileUrl} />}
        <button
          onClick={createMarketItem}
          className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
        >
          Create Digital Asset
        </button>
      </div>
    </div>
  );
}
