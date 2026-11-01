import React, { useEffect, useRef } from 'react';

const CloudinaryUpload = ({ onUploadSuccess, buttonText = "Unggah Gambar", className }) => {
  const widgetRef = useRef(null);

  useEffect(() => {
    // Load Cloudinary script dynamically if not present
    if (!window.cloudinary) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const openWidget = () => {
    if (!window.cloudinary) {
      alert("Cloudinary widget is still loading, please try again in a moment.");
      return;
    }

    if (!widgetRef.current) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo',
          uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset',
          sources: ['local', 'url', 'camera'],
          multiple: false,
          clientAllowedFormats: ['image'],
          maxImageFileSize: 2000000,
          theme: 'minimal'
        },
        (error, result) => {
          if (!error && result && result.event === "success") {
            onUploadSuccess(result.info.secure_url);
          }
        }
      );
    }
    
    widgetRef.current.open();
  };

  return (
    <button
      type="button"
      onClick={openWidget}
      className={className || "bg-secondary/10 hover:bg-secondary/20 text-secondary dark:bg-yellow-400/10 dark:hover:bg-yellow-400/20 dark:text-yellow-400 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"}
    >
      <span className="material-symbols-outlined text-sm">cloud_upload</span>
      {buttonText}
    </button>
  );
};

export default CloudinaryUpload;
