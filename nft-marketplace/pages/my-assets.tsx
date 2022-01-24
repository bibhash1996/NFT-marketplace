import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftAddress, nftMarketAddress } from "../.config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/Market.sol/NFTMarket.json";

type NFTItem = {
  price: string;
  tokenId: string;
  image: string;
  name: string;
  description: string;
  owner: string;
  seller: string;
};

export default function MyAssets() {
  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState<NFTItem[]>([]);

  useEffect(() => {
    getIntialData().then();
  }, []);

  const getIntialData = async () => {
    setLoading(true);
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
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
