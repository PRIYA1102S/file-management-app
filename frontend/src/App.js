import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000';

function App() {
  const [folderName, setFolderName] = useState('');
  const [files, setFiles] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Handle folder upload
  const handleFolderUpload = async (e) => {
    e.preventDefault();
    if (!folderName || files.length === 0) {
      setMessage('Please provide a folder name and select files.');
      return;
    }
    const formData = new FormData();
    formData.append('folderName', folderName);
    for (let file of files) {
      formData.append('files', file);
    }
    try {
      await axios.post(`${API_URL}/upload-folder`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Folder uploaded successfully.');
      fetchFileList();
    } catch (err) {
      setMessage('Error uploading folder.');
    }
  };

  // Fetch file list
  const fetchFileList = async () => {
    if (!folderName) return;
    try {
      const res = await axios.get(`${API_URL}/list-files`, { params: { folderName } });
      setFileList(res.data.files);
    } catch {
      setFileList([]);
    }
  };

  // Handle prompt actions (simple parser: create, edit, delete)
  const handlePrompt = async () => {
    if (!prompt.trim() || !folderName) return;
    const [action, ...rest] = prompt.trim().split(' ');
    const fileName = rest[0];
    const content = rest.slice(1).join(' ');
    if (action === 'create' && (!fileName || fileName.trim() === '')) {
      setMessage('Please provide a file name for creation.');
      return;
    }
    try {
      if (action === 'create') {
        await axios.post(`${API_URL}/create-file`, { folderName, fileName, content });
        setMessage(`File ${fileName} created.`);
      } else if (action === 'edit') {
        await axios.post(`${API_URL}/edit-file`, { folderName, fileName, content });
        setMessage(`File ${fileName} edited.`);
      } else if (action === 'delete') {
        await axios.post(`${API_URL}/delete-file`, { folderName, fileName });
        setMessage(`File ${fileName} deleted.`);
      } else {
        setMessage('Unknown command. Use: create, edit, or delete.');
        return;
      }
      fetchFileList();
    } catch (err) {
      setMessage('Operation failed.');
    }
  };

  // UI: Open edit modal and load file content
  const openEditModal = async (file) => {
    setSelectedFile(file);
    // Fetch file content
    try {
      const res = await axios.get(`${API_URL}/list-files`, { params: { folderName } });
      setEditContent('');
    } catch {
      setEditContent('');
    }
    setShowEditModal(true);
  };

  // UI: Handle edit submit
  const handleEditSubmit = async () => {
    try {
      await axios.post(`${API_URL}/edit-file`, { folderName, fileName: selectedFile, content: editContent });
      setMessage(`File ${selectedFile} edited.`);
      setShowEditModal(false);
      fetchFileList();
    } catch {
      setMessage('Failed to edit file.');
    }
  };

  // UI: Open delete confirm
  const openDeleteConfirm = (file) => {
    setSelectedFile(file);
    setShowDeleteConfirm(true);
  };

  // UI: Handle delete
  const handleDelete = async () => {
    try {
      await axios.post(`${API_URL}/delete-file`, { folderName, fileName: selectedFile });
      setMessage(`File ${selectedFile} deleted.`);
      setShowDeleteConfirm(false);
      fetchFileList();
    } catch {
      setMessage('Failed to delete file.');
    }
  };

  return (
    <div className="mcp-container">
      <h2 style={{ textAlign: 'center', marginBottom: 28, color: '#4f8cff', letterSpacing: 1 }}>MCP Filesystem Manager</h2>
      <div className="mcp-section">
        <form onSubmit={handleFolderUpload} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Folder Name"
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
            className="mcp-input"
          />
          <input
            type="file"
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={e => setFiles(Array.from(e.target.files))}
            className="mcp-input"
          />
          <button type="submit" className="mcp-button">Upload Folder</button>
        </form>
      </div>
      <div className="mcp-section">
        <input
          type="text"
          placeholder="Prompt (e.g. create file.txt Hello)"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="mcp-input"
          style={{ width: '60%' }}
        />
        <button onClick={handlePrompt} className="mcp-button">Run</button>
      </div>
      {message && <div className="mcp-message">{message}</div>}
      <div className="mcp-section">
        <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Files in Folder:</h4>
        <ul className="mcp-file-list">
          {fileList.map(f => (
            <li key={f} className="mcp-file-item">
              <span className="mcp-file-name">{f}</span>
              <button className="mcp-button" onClick={() => openEditModal(f)}>Edit</button>
              <button className="mcp-button mcp-button-danger" onClick={() => openDeleteConfirm(f)}>Delete</button>
            </li>
          ))}
        </ul>
        <button onClick={fetchFileList} className="mcp-button" style={{ marginTop: 10 }}>Refresh File List</button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="mcp-modal-overlay">
          <div className="mcp-modal">
            <h3 className="mcp-modal-title">Edit {selectedFile}</h3>
            <textarea
              rows={8}
              className="mcp-textarea"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
            />
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <button onClick={() => setShowEditModal(false)} className="mcp-button" style={{ marginRight: 8, background: '#bbb' }}>Cancel</button>
              <button onClick={handleEditSubmit} className="mcp-button">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="mcp-modal-overlay">
          <div className="mcp-modal">
            <h3 className="mcp-modal-title">Delete {selectedFile}?</h3>
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <button onClick={() => setShowDeleteConfirm(false)} className="mcp-button" style={{ marginRight: 8, background: '#bbb' }}>Cancel</button>
              <button onClick={handleDelete} className="mcp-button mcp-button-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 