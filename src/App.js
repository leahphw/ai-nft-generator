import { useState, useEffect } from 'react';
import { NFTStorage, File } from 'nft.storage'
import { Buffer } from 'buffer';
import axios from 'axios';
import { ethers } from 'ethers';

// Components
import Spinner from 'react-bootstrap/Spinner';
import Navigation from './components/Navigation';

// ABIs
import NFT from './abis/NFT.json'

// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState(null)
  const [url, setURL] = useState(null)

  // Handlers
  const submitHandler = async (e) => {
    e.preventDefault()
    const imageData = createImage()
    const url = await uploadImage()
    console.log("url:", url)
  }

  const createImage = async () => {
    console.log("generating nft...")

    // Sending requests to huggin face
    const URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2"
    const response = await axios({
      url: URL,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE_API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        inputs: description, options: { wait_for_model: true },
      }),
      responseType: 'arraybuffer',
    })

    const type = response.headers['content-type']
    const data = response.data

    const base64data = Buffer.from(data).toString('base64')
    const img = `data:${type};base64,` + base64data // <-- This is so we can render it on the page
    setImage(img)

    return data
  }

  const uploadImage = async (imageData) => {
    console.log("uploading image...")

    // Declare NFT Storage
    const nftstorage = new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE_API_KEY })
    const { ipnft } = await nftstorage.store({
      image: new File([imageData], 'image.jpeg', { type: "image/jpeg" }),
      name: name,
      description: description,
    })

    const url = `https://ipfs.io/ipfs/${ipnft}/metadata.json`
    setURL(url)
    
    return url
  }

  const loadBlockchainData = async () => {
    const provider = new ethers.getDefaultProvider()
    setProvider(provider)
  }

  useEffect(() => {
    loadBlockchainData()
  }, [])

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <div className='form'>
        <form onSubmit={submitHandler}>
          <input type='text' placeholder='NFT Name' onChange={(e) => { setName(e.target.value) }}></input>
          <input type='text' placeholder='NFT Prompt' onChange={(e) => { setDescription(e.target.value) }}></input>
          <input type='submit' value='Create & Mint'></input>
        </form>

        <div className='image'>
          <img src={image} alt='AI Generated Image'></img>
        </div>
      </div>

      <p className='viewmtd'>View&nbsp; <a href={url} target='_blank' rel='noreferer'>Metadata</a></p>

    </div>
  );
}

export default App;

