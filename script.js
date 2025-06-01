// frontend/script.js

document.addEventListener('DOMContentLoaded', () => {
    const backendUrl = 'http://127.0.0.1:5000';
    // --- Smooth Scrolling for Navigation ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // --- DETECT SECTION LOGIC ---
    const urlInput = document.getElementById('urlInput');
    const detectButton = document.getElementById('detectButton');
    const resultText = document.getElementById('resultText');
    const resultLabel = document.getElementById('resultLabel');

    if (detectButton) {
        detectButton.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            if (!url) {
                resultText.textContent = "Please enter a URL to detect.";
                resultLabel.textContent = "";
                resultLabel.className = "result-label"; 
                return;
            }

            resultText.textContent = "Detecting...";
            resultLabel.textContent = "";
            resultLabel.className = "result-label";

            try {
                const response = await fetch(`${backendUrl}/detect`, { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: url }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                    throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
                }

                const data = await response.json();

                if (data.status === "success") {
                    resultText.textContent = data.explanation;
                    resultLabel.textContent = data.result; 

                    // Apply dynamic styling based on result
                    if (data.result === "PHISHING DETECTED") {
                        resultLabel.classList.add('phishing-detected');
                        resultLabel.classList.remove('no-phishing-detected');
                    } else if (data.result === "NO PHISHING DETECTED") {
                        resultLabel.classList.add('no-phishing-detected');
                        resultLabel.classList.remove('phishing-detected');
                    } else {
                        resultLabel.className = "result-label"; 
                    }
                    // After successful detection, refresh history
                    loadHistory();
                } else {
                    resultText.textContent = `Error: ${data.message || 'Unknown error during detection.'}`;
                    resultLabel.textContent = "";
                    resultLabel.className = "result-label";
                }
            } catch (error) {
                console.error('Error during detection:', error);
                resultText.textContent = `Failed to connect to the detection service or an error occurred: ${error.message}`;
                resultLabel.textContent = "";
                resultLabel.className = "result-label";
            }
        });
    }


    // --- HISTORY SECTION LOGIC ---
    const historyTableBody = document.querySelector('#historyTable tbody');
    const downloadCsvButton = document.getElementById('downloadCsvButton');

    async function loadHistory() {
        if (!historyTableBody) return; 

        try {
            const response = await fetch(`${backendUrl}/history`); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const history = data.history;

            historyTableBody.innerHTML = ''; 

            // Display newest entries first as per common UI expectation
            // history.reverse(); // Backend sudah mengurutkan, jadi ini mungkin tidak perlu lagi

            if (history && history.length > 0) {
                history.forEach(entry => {
                    const row = historyTableBody.insertRow();
                    const dateCell = row.insertCell(0);
                    const linkCell = row.insertCell(1);
                    const labelCell = row.insertCell(2);
                    const explanationCell = row.insertCell(3);

                    dateCell.textContent = entry.timestamp;
                    
                    // Truncate URL if too long for display
                    const displayLink = entry.link.length > 50 ? entry.link.substring(0, 47) + '...' : entry.link;
                    linkCell.textContent = displayLink;
                    linkCell.title = entry.link; // Full link on hover

                    labelCell.textContent = entry.label;
                    if (entry.label === "PHISHING DETECTED") {
                        labelCell.style.color = '#ff4d4d'; // Red
                        labelCell.style.fontWeight = 'bold';
                    } else if (entry.label === "NO PHISHING DETECTED") {
                        labelCell.style.color = '#66ff66'; // Green
                        labelCell.style.fontWeight = 'bold';
                    }
                    explanationCell.textContent = entry.explanation;
                    explanationCell.classList.add('explanation-cell'); 
                });
            } else {
                const row = historyTableBody.insertRow();
                const cell = row.insertCell(0);
                cell.colSpan = 4;
                cell.textContent = "No detection history available.";
                cell.style.textAlign = "center";
                cell.style.color = "#ccc";
            }

        } catch (error) {
            console.error('Error loading history:', error);
            historyTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ff4d4d;">Failed to load history: ${error.message}. Please ensure the backend is running and the /history endpoint is correctly implemented.</td></tr>`;
        }
    }

    if (downloadCsvButton) {
        downloadCsvButton.addEventListener('click', () => {
            window.open(`${backendUrl}/download_history`, '_blank');
        });
    }

    // Load history when the history section is visible
    // Using Intersection Observer for better performance
    const historySection = document.getElementById('history');
    if (historySection) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadHistory();
                    observer.unobserve(entry.target); 
                }
            });
        }, { threshold: 0.1 }); 

        observer.observe(historySection);
    }


    // --- DOWNLOAD EXTENSION SECTION LOGIC ---
    const downloadExtensionButton = document.getElementById('downloadExtensionButton');
    if (downloadExtensionButton) {
        downloadExtensionButton.addEventListener('click', () => {
            window.open(`${backendUrl}/download_extension`, '_blank');
        });
    }

    // Initial load for any sections that might be in view on page load
    // loadHistory(); // Ini bisa dihapus jika Intersection Observer sudah digunakan secara efektif.

});

// Additional JS for hero section next button opacity (if it's not handled by CSS animation)
document.addEventListener('scroll', function() {
    const heroSection = document.getElementById('home');
    const nextButton = document.querySelector('.next-btn');

    if (heroSection && nextButton) {
        const scrollPosition = window.scrollY;
        const heroHeight = heroSection.offsetHeight;

        // Calculate opacity based on scroll. Adjust 200 for faster/slower fade.
        const opacity = 1 - (scrollPosition / (heroHeight / 2));
        nextButton.style.opacity = Math.max(0, Math.min(1, opacity));

        // Hide next button if scrolled past hero section
        if (scrollPosition > heroHeight - 100) { // Adjust threshold as needed
            nextButton.style.display = 'none';
        } else {
            nextButton.style.display = 'flex'; // Use flex to center content
        }
    }
});

// Initial check for next button opacity on page load
document.dispatchEvent(new Event('scroll'));

