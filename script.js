document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const previewContainer = document.getElementById('previewContainer');
    const pageSizeSelect = document.getElementById('pageSize');
    const customSizeGroup = document.getElementById('customSizeGroup');
    const customWidth = document.getElementById('customWidth');
    const customHeight = document.getElementById('customHeight');
    const pageOrientation = document.getElementById('pageOrientation');
    const pageSpread = document.getElementById('pageSpread');
    const borderSize = document.getElementById('borderSize');
    const borderSizeValue = document.getElementById('borderSizeValue');
    const borderColor = document.getElementById('borderColor');
    const pdfName = document.getElementById('pdfName');

    // State
    let uploadedImages = [];
    let pdfImages = [];

    // Event Listeners
    fileInput.addEventListener('change', handleFileSelect);
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    generateBtn.addEventListener('click', generatePDF);
    clearBtn.addEventListener('click', clearAll);
    pageSizeSelect.addEventListener('change', toggleCustomSize);
    borderSize.addEventListener('input', updateBorderSizeValue);
    pageSpread.addEventListener('change', updatePreview);
    borderSize.addEventListener('change', updatePreview);
    borderColor.addEventListener('change', updatePreview);
    pageOrientation.addEventListener('change', updatePreview);

    // Functions
    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            processFiles(files);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('highlight');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('highlight');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('highlight');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFiles(files);
        }
    }

    function processFiles(files) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            alert('Please select image files only.');
            return;
        }

        uploadedImages = [];
        pdfImages = [];
        
        imageFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    uploadedImages.push({
                        file: file,
                        element: img,
                        width: img.width,
                        height: img.height,
                        url: e.target.result
                    });
                    
                    if (uploadedImages.length === imageFiles.length) {
                        updatePreview();
                        generateBtn.disabled = false;
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function toggleCustomSize() {
        if (pageSizeSelect.value === 'custom') {
            customSizeGroup.classList.remove('hidden');
        } else {
            customSizeGroup.classList.add('hidden');
        }
        updatePreview();
    }

    function updateBorderSizeValue() {
        borderSizeValue.textContent = `${borderSize.value} mm`;
    }

    function getPageDimensions() {
        let width, height;
        
        switch (pageSizeSelect.value) {
            case 'a4':
                width = 210;
                height = 297;
                break;
            case 'letter':
                width = 215.9;
                height = 279.4;
                break;
            case 'legal':
                width = 215.9;
                height = 355.6;
                break;
            case 'custom':
                width = parseFloat(customWidth.value) || 210;
                height = parseFloat(customHeight.value) || 297;
                break;
            default:
                width = 210;
                height = 297;
        }
        
        if (pageOrientation.value === 'landscape') {
            return { width: height, height: width };
        }
        
        return { width, height };
    }

    function calculateImageLayout(pageWidth, pageHeight, borderSize, spread) {
        const borderSizePx = borderSize * 3.78; // Convert mm to px (roughly)
        const contentWidth = pageWidth - (2 * borderSizePx);
        const contentHeight = pageHeight - (2 * borderSizePx);
        
        let imagesPerPage = 1;
        let cols = 1;
        let rows = 1;
        
        switch (spread) {
            case 'double':
                imagesPerPage = 2;
                cols = 2;
                rows = 1;
                break;
            case 'quad':
                imagesPerPage = 4;
                cols = 2;
                rows = 2;
                break;
        }
        
        const cellWidth = contentWidth / cols;
        const cellHeight = contentHeight / rows;
        
        return {
            imagesPerPage,
            cellWidth,
            cellHeight,
            borderSizePx
        };
    }

    function updatePreview() {
        if (uploadedImages.length === 0) {
            previewContainer.innerHTML = '<p>Your PDF preview will appear here</p>';
            return;
        }
        
        const { width: pageWidth, height: pageHeight } = getPageDimensions();
        const borderSizeValue = parseInt(borderSize.value);
        const spread = pageSpread.value;
        
        const {
            imagesPerPage,
            cellWidth,
            cellHeight,
            borderSizePx
        } = calculateImageLayout(pageWidth, pageHeight, borderSizeValue, spread);
        
        // Scale down for preview
        const previewScale = 150 / pageWidth;
        const previewPageHeight = pageHeight * previewScale;
        const previewCellWidth = cellWidth * previewScale;
        const previewCellHeight = cellHeight * previewScale;
        const previewBorderSize = borderSizePx * previewScale;
        
        previewContainer.innerHTML = '';
        
        const totalPages = Math.ceil(uploadedImages.length / imagesPerPage);
        
        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'preview-page';
            pageDiv.style.width = `${150}px`;
            pageDiv.style.height = `${previewPageHeight}px`;
            pageDiv.style.border = `1px solid ${borderColor.value}`;
            
            const startIndex = pageNum * imagesPerPage;
            const endIndex = Math.min(startIndex + imagesPerPage, uploadedImages.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                const imgData = uploadedImages[i];
                const imgIndex = i - startIndex;
                
                let col = imgIndex % 2;
                let row = Math.floor(imgIndex / 2);
                
                if (spread === 'double') {
                    col = imgIndex;
                    row = 0;
                }
                
                const imgDiv = document.createElement('img');
                imgDiv.className = 'preview-image';
                imgDiv.src = imgData.url;
                
                // Calculate aspect ratio and fit within cell
                const imgAspect = imgData.width / imgData.height;
                const cellAspect = previewCellWidth / previewCellHeight;
                
                let imgWidth, imgHeight;
                
                if (imgAspect > cellAspect) {
                    // Fit to width
                    imgWidth = previewCellWidth;
                    imgHeight = previewCellWidth / imgAspect;
                } else {
                    // Fit to height
                    imgHeight = previewCellHeight;
                    imgWidth = previewCellHeight * imgAspect;
                }
                
                // Center in cell
                const offsetX = (previewCellWidth - imgWidth) / 2;
                const offsetY = (previewCellHeight - imgHeight) / 2;
                
                imgDiv.style.width = `${imgWidth}px`;
                imgDiv.style.height = `${imgHeight}px`;
                imgDiv.style.left = `${previewBorderSize + (col * previewCellWidth) + offsetX}px`;
                imgDiv.style.top = `${previewBorderSize + (row * previewCellHeight) + offsetY}px`;
                imgDiv.style.border = `${previewBorderSize / 2}px solid ${borderColor.value}`;
                
                pageDiv.appendChild(imgDiv);
            }
            
            previewContainer.appendChild(pageDiv);
        }
    }

    function generatePDF() {
        if (uploadedImages.length === 0) {
            alert('Please upload images first.');
            return;
        }
        
        const { width: pageWidth, height: pageHeight } = getPageDimensions();
        const borderSizeValue = parseInt(borderSize.value);
        const spread = pageSpread.value;
        
        const {
            imagesPerPage,
            cellWidth,
            cellHeight,
            borderSizePx
        } = calculateImageLayout(pageWidth, pageHeight, borderSizeValue, spread);
        
        // Create a new jsPDF instance
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: pageOrientation.value,
            unit: 'mm',
            format: pageSizeSelect.value === 'custom' ? 
                [customWidth.value, customHeight.value] : 
                pageSizeSelect.value
        });
        
        const totalPages = Math.ceil(uploadedImages.length / imagesPerPage);
        
        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
            if (pageNum > 0) {
                doc.addPage();
            }
            
            const startIndex = pageNum * imagesPerPage;
            const endIndex = Math.min(startIndex + imagesPerPage, uploadedImages.length);
            
            // Draw border if size > 0
            if (borderSizeValue > 0) {
                doc.setDrawColor(borderColor.value);
                doc.setFillColor(borderColor.value);
                doc.rect(
                    0, 
                    0, 
                    pageWidth, 
                    pageHeight, 
                    'F'
                );
                
                doc.setDrawColor(255, 255, 255);
                doc.setFillColor(255, 255, 255);
                doc.rect(
                    borderSizeValue, 
                    borderSizeValue, 
                    pageWidth - (2 * borderSizeValue), 
                    pageHeight - (2 * borderSizeValue), 
                    'F'
                );
            }
            
            for (let i = startIndex; i < endIndex; i++) {
                const imgData = uploadedImages[i];
                const imgIndex = i - startIndex;
                
                let col = imgIndex % 2;
                let row = Math.floor(imgIndex / 2);
                
                if (spread === 'double') {
                    col = imgIndex;
                    row = 0;
                }
                
                // Calculate position
                const x = borderSizePx + (col * cellWidth);
                const y = borderSizePx + (row * cellHeight);
                
                // Calculate image dimensions to maintain aspect ratio
                const imgAspect = imgData.width / imgData.height;
                const cellAspect = cellWidth / cellHeight;
                
                let imgWidth, imgHeight;
                
                if (imgAspect > cellAspect) {
                    // Fit to width
                    imgWidth = cellWidth;
                    imgHeight = cellWidth / imgAspect;
                } else {
                    // Fit to height
                    imgHeight = cellHeight;
                    imgWidth = cellHeight * imgAspect;
                }
                
                // Center in cell
                const offsetX = (cellWidth - imgWidth) / 2;
                const offsetY = (cellHeight - imgHeight) / 2;
                
                // Add image to PDF
                doc.addImage(
                    imgData.url,
                    'JPEG',
                    x + offsetX,
                    y + offsetY,
                    imgWidth,
                    imgHeight
                );
            }
        }
        
        // Save the PDF
        const filename = pdfName.value.trim() || 'output.pdf';
        doc.save(filename);
    }

    function clearAll() {
        fileInput.value = '';
        uploadedImages = [];
        pdfImages = [];
        previewContainer.innerHTML = '<p>Your PDF preview will appear here</p>';
        generateBtn.disabled = true;
    }

    // Initialize
    updateBorderSizeValue();
});

// Load jsPDF library dynamically
function loadScript(url, callback) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
}

loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', function() {
    console.log('jsPDF loaded');
});