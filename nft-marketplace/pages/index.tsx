import { ethers } from "ethers";
import { useState, useEffect } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import { nftAddress, nftMarketAddress } from "../.config";

// ABI's
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/Market.sol/NFTMarket.json";

type NFTItem = {
  price: string;
  tokenId: string;
  image: string;
  name: string;
  description: string;
  owner: string;
  seller: string;
};

export default function Home() {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNFTs().then();
  }, []);

  const loadNFTs = async () => {
    setLoading(true);
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(
      nftMarketAddress,
      Market.abi,
      provider
    );
    const marketItems: any[] = await marketContract.fetchMarketItems();
    const items: NFTItem[] = await Promise.all(
      marketItems.map(async (_item) => {
        const tokenUri = await tokenContract.tokenURI(_item.tokenId);
        // The token URI is going to be the IPFS url. Each IPFS object contains uri,desc,name
        const meta = await axios.get(tokenUri);
        const price = ethers.utils.formatUnits(_item.price.toString(), "ether");
        return {
          price,
          tokenId: _item.tokenId,
          image: meta.data.image,
          seller: _item.seller,
          owner: _item.owner,
          name: meta.data.name,
          description: meta.data.description,
        };
      })
    );

    setNfts(items);
    setLoading(false);
  };

  const buyNFT = async (nft: NFTItem) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const marketContract = new ethers.Contract(
      nftMarketAddress,
      Market.abi,
      signer
    );
    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");
    const transaction = await marketContract.createMarketSale(
      nftAddress,
      nft.tokenId,
      price
    );
    await transaction.wait();
    await loadNFTs();
  };

  if (!loading && !nfts.length)
    return <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>;

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {nfts.map((nft, i) => (
            <div key={i} className="border shadow rounded-xl overflow-hidden">
              <img src={nft.image} />
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-2xl font-semibold"
                >
                  {nft.name}
                </p>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p className="text-gray-400">{nft.description}</p>
                </div>
              </div>
              <div className="p-4 bg-black">
                <p className="text-2xl mb-4 font-bold text-white">
                  {nft.price} ETH
                </p>
                <button
                  className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                  onClick={async () => await buyNFT(nft)}
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
