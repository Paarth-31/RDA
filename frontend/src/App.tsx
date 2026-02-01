import {useState} from 'react';
import {useSocket} from './context/SocketContext';
import {v4 as uuidv4} from 'uuid';

function App(){
  const socket=useSocket();
  const [myId,setmyId]=useState("");
  const [remoteId,setremoteId]=useState("");

  const handleCreateId=()=>{
    const newId=uuidv4().slice(0,8);
    setmyId(newId);
    socket?.emit("join-room",{roomId:newId,emailId:"host@test.com"});
    alert(`your room id is: ${newId}. Share this with ur friend`);
  }

  const handleJoinId=()=>{
    if(!remoteId)return alert("Please enter an id first!");
    socket?.emit("join-room",{roomId:remoteId,emailId:"guest@test.com"});
    alert(`Joining room: ${remoteId}`);
  }
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginTop:'50px'}}>
      <h1>Remote Desktop App</h1>
      <div style={{border:'1px solid #ccc',padding:'20px',borderRadius:'10px',marginBottom:'20px'}}>
        <h3>Share Screen</h3>
        <button onClick={handleCreateId} style={{padding:'10px 20px',cursor:'pointer'}}>Generate My Id</button>
        {myId && <p>Your ID:<strong>{myId}</strong></p>}
      </div>

      <h2>OR</h2>

      <div style={{border:'1px solid #ccc',padding:'20px',borderRadius:'10px'}}>
        <h3>I want to control a Screen</h3>
        <input type="text" placeholder='enter friend"s id' value={remoteId} onChange={(e)=>setremoteId(e.target.value)} style={{padding:'10px', marginRight:'10px'}}></input>
        <button onClick={handleJoinId} style={{padding:'10px 20px', cursor:'pointer'}}>Join</button>
      </div>
    </div>
  );
}
export default App;