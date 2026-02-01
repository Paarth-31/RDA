import {Server} from 'socket.io';

const io=new Server(8080,{
  cors:{
    origin:"*",
    methods:["GET","POST"]
  }
});

io.on('connection',(socket)=>{
  console.log('User Connected: ',socket.id);
  
  socket.on('join-room',({roomId,emailId})=>{
    const room=io.sockets.adapter.rooms.get(roomId);
    const roomSize=room?room.size:0;
    if(roomSize>=2){
      console.log(`User ${emailId} rejected: Room ${roomId} is full..`);
      socket.emit('room-full',{message:"Room is already full!!"});
      return;
    }
    console.log(`User ${emailId} joined room: ${roomId}`);
    socket.join(roomId);
    socket.to(roomId).emit('user-joined',{emailId});
  });
  
  socket.on('disconnect',()=>{
    console.log('User disconnected: ',socket.id);
  });
})
console.log('Signaling Server running on port 8080');