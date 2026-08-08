import './style.css'

const API_BASE_URL = 'https://8l0ok70m30.execute-api.eu-west-2.amazonaws.com'

document.querySelector('#app').innerHTML = `
  <div class="app">
    <header class="header">
      <div>
        <h1>☁️ CloudVault</h1>
        <p>Simple, secure cloud file storage</p>
      </div>
    </header>

    <main class="container">

      <section class="upload-card">
        <h2>Upload a File</h2>
        <p>Select a file and upload it to your CloudVault S3 storage.</p>

        <input type="file" id="fileInput" />

        <button id="uploadBtn">
          Upload File
        </button>

        <p id="uploadStatus"></p>
      </section>

      <section class="files-card">
        <div class="files-header">
          <div>
            <h2>Your Files</h2>
            <p>Files currently stored in CloudVault</p>
          </div>

          <button id="refreshBtn">
            ↻ Refresh
          </button>
        </div>

        <div id="filesContainer">
          <p class="loading">Loading files...</p>
        </div>
      </section>

    </main>

    <footer>
      <p>CloudVault • AWS S3 • Lambda • API Gateway</p>
    </footer>
  </div>
`

const fileInput = document.querySelector('#fileInput')
const uploadBtn = document.querySelector('#uploadBtn')
const uploadStatus = document.querySelector('#uploadStatus')
const refreshBtn = document.querySelector('#refreshBtn')
const filesContainer = document.querySelector('#filesContainer')

async function loadFiles() {
  filesContainer.innerHTML = '<p class="loading">Loading files...</p>'

  try {
    const response = await fetch(`${API_BASE_URL}/files`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const files = await response.json()

    if (files.length === 0) {
      filesContainer.innerHTML = `
        <p class="empty">No files uploaded yet.</p>
      `
      return
    }

    filesContainer.innerHTML = `
      <div class="file-list">
        ${files.map(file => `
          <div class="file-item">
            <div class="file-icon">📄</div>

            <div class="file-info">
              <strong>${file.filename}</strong>
              <span>${formatSize(file.size)}</span>
            </div>

            <div class="file-date">
              ${formatDate(file.last_modified)}
            </div>
          </div>
        `).join('')}
      </div>
    `
  } catch (error) {
    console.error(error)

    filesContainer.innerHTML = `
      <p class="error">
        Unable to load files. Please check the API connection.
      </p>
    `
  }
}

async function uploadFile() {
  const file = fileInput.files[0]

  if (!file) {
    uploadStatus.textContent = 'Please select a file first.'
    uploadStatus.className = 'error'
    return
  }

  uploadBtn.disabled = true
  uploadBtn.textContent = 'Uploading...'
  uploadStatus.textContent = ''

  try {
    const base64 = await fileToBase64(file)

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: file.name,
        file: base64
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed')
    }

    uploadStatus.textContent = `✓ ${result.file} uploaded successfully!`
    uploadStatus.className = 'success'

    fileInput.value = ''

    await loadFiles()

  } catch (error) {
    console.error(error)

    uploadStatus.textContent = `Upload failed: ${error.message}`
    uploadStatus.className = 'error'
  }

  uploadBtn.disabled = false
  uploadBtn.textContent = 'Upload File'
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }

    reader.onerror = reject

    reader.readAsDataURL(file)
  })
}

function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date) {
  return new Date(date).toLocaleString()
}

uploadBtn.addEventListener('click', uploadFile)
refreshBtn.addEventListener('click', loadFiles)

loadFiles()