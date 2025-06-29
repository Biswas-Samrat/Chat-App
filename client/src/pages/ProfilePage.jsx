import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);

  const [selectedImg, setSelectedImg] = useState(null);
  const navigate = useNavigate();
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImg) {
      await updateProfile({ fullName: name, bio });
      navigate("/");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedImg);
    reader.onload = async () => {
      const base64Image = reader.result;
      await updateProfile({ profilePic: base64Image, fullName: name, bio });
      navigate("/");
    };
  };

  return (
    <div
      className="min-vh-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundImage: `url(${assets.background_image})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="bg-dark bg-opacity-75 p-5 rounded-4 shadow-lg w-100"
        style={{ maxWidth: "600px" }}
      >
        <form onSubmit={handleSubmit}>
          <h3 className="text-center text-white mb-4">Edit Profile</h3>

          {/* Profile Image Upload */}
          <div className="mb-4 text-center">
            <label htmlFor="avatar" className="d-block mb-2 text-light fw-bold">
              Upload Profile Image
            </label>
            <input
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
              onChange={(e) => setSelectedImg(e.target.files[0])}
            />
            <label htmlFor="avatar" className="cursor-pointer">
              <img
                src={
                  selectedImg
                    ? URL.createObjectURL(selectedImg)
                    : assets.avatar_icon
                }
                alt="Profile Avatar"
                className={`border border-4 rounded-circle img-thumbnail shadow-sm`}
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  cursor: "pointer",
                }}
              />
              <div className="text-info mt-2 small">Click to change image</div>
            </label>
          </div>

          {/* Name Input */}
          <div className="mb-3">
            <label htmlFor="name" className="form-label text-white">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="form-control bg-dark text-white border-secondary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
            />
          </div>

          {/* Bio Textarea */}
          <div className="mb-4">
            <label htmlFor="bio" className="form-label text-white">
              Bio
            </label>
            <textarea
              id="bio"
              className="form-control bg-dark text-white border-secondary"
              rows="4"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
            ></textarea>
          </div>

          {/* Save Button */}
          <div className="d-grid">
            <button type="submit" className="btn btn-primary btn-lg shadow">
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
