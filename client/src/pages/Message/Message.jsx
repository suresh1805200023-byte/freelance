import toast from 'react-hot-toast';
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRecoilValue } from "recoil";
import { userState } from "../../atoms";
import { axiosFetch, generateImageURL } from '../../utils';
import { Loader } from '../../components';
import "./Message.scss";
import { useState } from 'react';

const Message = () => {
  const user = useRecoilValue(userState);
  const { conversationID } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  const { isLoading, error, data } = useQuery({
    queryKey: ['messages'],
    queryFn: () =>
      axiosFetch.get(`/messages/${conversationID}`)
        .then(({ data }) => {
          return data;
        })
        .catch(({ response }) => {
          toast.error(response.data.message)
        })
  });
  
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (message) => 
      axiosFetch.post('/messages', message)
    ,
    onSuccess: () =>
      queryClient.invalidateQueries(['messages'])
  })

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleMessageSubmit = async (event) => {
    event.preventDefault();

    const description = event.target[0].value;

    if (!description && !selectedFile) {
        toast.error("Please enter a message or select a file.");
        return;
    }

    let fileUrl = null;
    if (selectedFile) {
        setIsUploading(true);
        toast.info("Uploading file...");
        try {
            const uploadResponse = await generateImageURL(selectedFile);
            fileUrl = uploadResponse.url;
            toast.success("File uploaded!");
        } catch (uploadError) {
            console.error("File upload failed:", uploadError);
            toast.error("File upload failed.");
            setIsUploading(false);
            return;
        } finally {
            setIsUploading(false);
        }
    }

    mutation.mutate({
      conversationID,
      description: description || null,
      file: fileUrl || null,
    });

    event.target.reset();
    setSelectedFile(null);
  }

  return (
    <div className="message">
      <div className="container">
        <span className="breadcrumbs">
          <Link to="/messages" className="link">Messages</Link>
        </span>
        {
          isLoading
            ? <div className="loader"> <Loader /> </div>
            : error
              ? 'Something went wrong'
              : <div className="messages">
                {
                  data.map((message) => (
                    <div className={message.userID._id === user._id ? 'owner item' : 'item'} key={message._id}>
                      <img
                        src={message.userID.image || '/media/noavatar.png'}
                        alt=""
                      />
                      <p>
                        {message.file ? (
                            <img src={message.file} alt="Attached file" style={{ maxWidth: '100%', height: 'auto' }} />
                        ) : (
                            message.description
                        )}
                      </p>
                    </div>
                  ))
                }
              </div>
        }
        <hr />
        <form className="write" onSubmit={handleMessageSubmit}>
          <textarea cols="30" rows="10" placeholder="Write a message" disabled={isUploading}></textarea>
          <input type="file" id="file" style={{display: "none"}} onChange={handleFileChange} disabled={isUploading} />
          <label htmlFor="file">
            <button type="button" className="file-upload-button" disabled={isUploading}>Attach File</button>
          </label>
          <button type='submit' disabled={isUploading}>Send</button>
          {selectedFile && <span>{selectedFile.name} ready to send</span>}
          {isUploading && <span>Uploading...</span>}
        </form>
      </div>
    </div>
  );
};

export default Message;