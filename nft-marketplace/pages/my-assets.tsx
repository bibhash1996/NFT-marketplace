import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftAddress, nftMarketAddress } from "../.config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/Market.sol/NFTMarket.json";

import Authereum from "authereum";
import WalletConnectProvider from "@walletconnect/web3-provider";

type NFTItem = {
  price: string;
  tokenId: string;
  image: string;
  name: string;
  description: string;
  owner: string;
  seller: string;
};

let providerOptions = {
  metamask: {
    id: "injected",
    name: "MetaMask",
    type: "injected",
    check: "isMetaMask",
  },
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: "737e11f0574f4c28a92679ea10cf6c89", // Required
      network: "maticmum",
      qrcodeModalOptions: {
        mobileLinks: [
          "rainbow",
          "metamask",
          "argent",
          "trust",
          "imtoken",
          "pillar",
        ],
      },
    },
  },
};

export default function MyAssets() {
  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState<NFTItem[]>([]);

  useEffect(() => {
    getIntialData().then((provider) => {
      if (
        provider &&
        provider.connection &&
        provider.connection.url === "metamask"
      ) {
        console.log("Connected Metamask");
        (window as any).ethereum.on("connect", function (accounts: any) {
          console.log("metamask connected : ", accounts);
          // Update user details whn accounts changed
        });
        (window as any).ethereum.on(
          "accountsChanged",
          function (accounts: any) {
            console.log("metamask Accounts changed : ", accounts);
            // Update user details whn accounts changed
          }
        );
      } else {
        provider.on("error", (e) => console.error("Error coonecting :", e));
        provider.on("connect", (info: { chainId: number }) => {
          console.log("Connected  :", info);
        });
        provider.on("disconnect", (code: number, reason: string) => {
          console.log(code, reason);
        });
        provider.on("accountsChanged", async (accounts: string[]) => {
          console.log("Accounts changes : ", accounts);
        });
        provider.addListener("connect", (data: any) => {
          console.log("Connected : ", data);
        });
      }
    });
  }, []);

  const getIntialData = async () => {
    setLoading(true);
    console.log("Before connect");
    const web3Modal = new Web3Modal({
      // // network: "maticmum",
      providerOptions: providerOptions as any,
      cacheProvider: false,
      disableInjectedProvider: false,
    });

    // const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    console.log("After connect");
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();

    console.log("Address : ", await provider.listAccounts());
    //Check the length of list accounts

    const nftMarketContract = new ethers.Contract(
      nftMarketAddress,
      NFTMarket.abi,
      signer
    );
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const items: any[] = await nftMarketContract.fethcMyNFTs();
    console.log("ITEM : ", items);
    const myItems: NFTItem[] = await Promise.all([
      ...items.map(async (_item) => {
        const tokenUri = await tokenContract.tokenURI(_item.tokenId);
        const meta: any = await axios.get(tokenUri);
        const tokenId = _item.tokenId;
        const price = ethers.utils.parseUnits(_item.price.toString(), "ether");
        return {
          price: price.toString(),
          tokenId: tokenId,
          seller: _item.seller,
          owner: _item.owner,
          image: meta.data.image,
          name: meta.name as string,
          description: meta.description as string,
        } as NFTItem;
      }),
    ]);

    setNfts(myItems);
    setLoading(false);
    return provider;
  };

  if (!loading && !nfts.length)
    return <h1 className="py-10 px-20 text-3xl">No assets owned</h1>;

  return (
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {nfts.map((nft, i) => (
            <div key={i} className="border shadow rounded-xl overflow-hidden">
              <img src={nft.image} className="rounded" />
              <div className="p-4 bg-black">
                <p className="text-2xl font-bold text-white">
                  Price - {nft.price} Eth
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
