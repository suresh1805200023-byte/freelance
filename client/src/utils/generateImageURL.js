import axios from "axios";

const generateImageURL = async (image) => {
  const file = new FormData();
  file.append("file", image);
  file.append(
    "upload_preset",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    file
  );

  return data;
};

export default generateImageURL;