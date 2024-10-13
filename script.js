// Polling interval in milliseconds
const POLLING_INTERVAL = 2000; // 2 seconds
let isRequestInProgress = false; // Flag to prevent duplicate requests

// Function to check if the input is a chemical formula
function isFormula(input) {
	return /[A-Za-z0-9]/.test(input) && /\d/.test(input);
}

// Function to format numbers as subscript in the chemical formula
function formatWithSubscript(input) {
	return input.replace(/\\\d|(\d+)/g, function (match) {
		if (match.startsWith("\\")) {
			return match.substring(1); // Remove backslash from escaped numbers
		} else {
			return match
				.split("")
				.map((num) => String.fromCharCode(8320 + parseInt(num)))
				.join(""); // Convert to subscript
		}
	});
}

// Main function to translate chemical compounds
async function translateCompound() {
	const input = document.getElementById("inputField").value.trim(); // Get user input
	const outputDiv = document.getElementById("output"); // Output display area
	const loadingSpinner = document.getElementById("loadingSpinner"); // Loading spinner element

	// Validate input
	if (!input) {
		outputDiv.style.display = "block";
		outputDiv.innerHTML = "Please enter a chemical name or formula.";
		return;
	}

	// Clear previous results
	outputDiv.style.display = "none";
	outputDiv.innerHTML = "";

	// Prevent duplicate requests
	if (isRequestInProgress) {
		outputDiv.style.display = "block";
		outputDiv.innerHTML = "Please wait for the current request to finish.";
		return;
	}

	// Mark the request as in progress and show the loading spinner
	isRequestInProgress = true;
	loadingSpinner.style.display = "flex";

	let result = null;

	// Determine if the input is a formula or name
	if (isFormula(input)) {
		result = await fetchCompoundByFormula(input); // Fetch data by formula
	} else {
		result = await fetchCompoundByName(input); // Fetch data by name
	}

	// Display the result or an error message
	if (result) {
		const formattedFormula = formatWithSubscript(result.formula);
		outputDiv.style.display = "block";
		outputDiv.innerHTML = `<strong>Name:</strong> ${result.name}<br><strong>Formula:</strong> ${formattedFormula}`;
	} else {
		outputDiv.style.display = "block";
		outputDiv.innerHTML = "Compound not found.";
	}

	// Mark the request as complete and hide the loading spinner
	isRequestInProgress = false;
	loadingSpinner.style.display = "none";
}

// Fetch compound data by formula from PubChem API
async function fetchCompoundByFormula(formula) {
	const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/formula/${encodeURIComponent(formula)}/JSON`;

	try {
		const response = await fetch(url); // Make the API call
		const data = await response.json(); // Parse JSON response

		// Check if the request is still processing
		if (data.Waiting && data.Waiting.ListKey) {
			return await pollForResult(data.Waiting.ListKey); // Poll for the result
		}

		// Handle the BadRequest error
		if (data.Fault && data.Fault.Code === "PUGREST.BadRequest") {
			console.error("Bad Request Error:", data.Fault.Message);
			return null; // Return null to indicate a failure
		}

		// Extract compound data if available
		if (data && data.PC_Compounds && data.PC_Compounds.length > 0) {
			const compound = data.PC_Compounds[0];
			const name = compound.props.find((p) => p.urn.label === "IUPAC Name")
				?.value.sval;
			return {
				name: name || "Unknown",
				formula: formula,
			};
		}
	} catch (error) {
		console.error("Error fetching compound by formula:", error);
	}

	return null; // Return null if no data is found
}

// Fetch compound data by name from PubChem API
async function fetchCompoundByName(name) {
	const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/JSON`;

	try {
		const response = await fetch(url); // Make the API call
		const data = await response.json(); // Parse JSON response

		// Check if the request is still processing
		if (data.Waiting && data.Waiting.ListKey) {
			return await pollForResult(data.Waiting.ListKey); // Poll for the result
		}

		// Handle the BadRequest error
		if (data.Fault && data.Fault.Code === "PUGREST.BadRequest") {
			console.error("Bad Request Error:", data.Fault.Message);
			return null; // Return null to indicate a failure
		}

		// Extract compound data if available
		if (data && data.PC_Compounds && data.PC_Compounds.length > 0) {
			const compound = data.PC_Compounds[0];
			const formula = compound.props.find(
				(p) => p.urn.label === "Molecular Formula",
			)?.value.sval;
			return {
				name: name,
				formula: formula || "Unknown",
			};
		}
	} catch (error) {
		console.error("Error fetching compound by name:", error);
	}

	return null; // Return null if no data is found
}

// Function to poll the PubChem API for results using ListKey
async function pollForResult(listKey) {
	const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/listkey/${listKey}/JSON`;

	try {
		let isWaiting = true; // Flag to manage polling
		let result = null;

		// Polling loop until a result is received or an error occurs
		while (isWaiting) {
			const response = await fetch(url);
			const data = await response.json();

			// Check if the request is still running
			if (data.Waiting) {
				console.log("Waiting for result...");
				await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL)); // Wait before polling again
			} else if (data.Fault && data.Fault.Code === "PUGREST.BadRequest") {
				console.error("Polling Error: Bad Request", data.Fault.Message);
				isWaiting = false; // Stop polling on bad request
				return null; // Return null to indicate a failure
			} else if (data.PC_Compounds && data.PC_Compounds.length > 0) {
				result = data.PC_Compounds[0]; // The result is ready
				isWaiting = false; // Stop polling
			}
		}

		// Extract name and formula from the result
		if (result) {
			const name = result.props.find((p) => p.urn.label === "IUPAC Name")?.value
				.sval;
			const formula = result.props.find(
				(p) => p.urn.label === "Molecular Formula",
			)?.value.sval;
			return {
				name: name || "Unknown",
				formula: formula || "Unknown",
			};
		}
	} catch (error) {
		console.error("Error polling for result:", error);
	}

	return null; // Return null if no result is found
}

// Add an event listener for the input field to trigger translation on Enter key press
document
	.getElementById("inputField")
	.addEventListener("keypress", function (event) {
		if (event.key === "Enter") {
			// Check if the pressed key is "Enter"
			event.preventDefault(); // Prevent form submission
			translateCompound(); // Trigger the translate function
		}
	});
