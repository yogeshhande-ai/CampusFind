// ==========================================
// CAMPUSFIND - FRONTEND JAVASCRIPT
// ==========================================

let allItems = [];


// ==========================================
// LOAD ITEMS
// ==========================================

async function loadItems() {

    const container =
        document.getElementById("itemsContainer");

    if (!container) return;

    try {

        const response =
            await fetch("/api/items");

        if (!response.ok) {

            throw new Error(
                "Failed to fetch items"
            );

        }

        allItems =
            await response.json();

        displayItems(allItems);

        updateStats(allItems);

    } catch (error) {

        console.error(
            "Error loading items:",
            error
        );

        container.innerHTML = `
            <div class="loading-message">

                <div class="loading-icon">
                    ⚠️
                </div>

                <p>
                    Unable to load items.
                </p>

            </div>
        `;
    }
}


// ==========================================
// DISPLAY ITEMS
// ==========================================

function displayItems(items) {

    const container =
        document.getElementById(
            "itemsContainer"
        );

    if (!container) return;

    if (items.length === 0) {

        container.innerHTML = `
            <div class="loading-message">

                <div class="loading-icon">
                    📦
                </div>

                <h3>
                    No Items Reported Yet
                </h3>

                <p>
                    Be the first person to
                    report a lost or found item.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML =
        items.map(item => {

            const type =
    item.type || "Lost";

        const statusClass =
                type.toLowerCase() === "lost"
                ? "lost"
                : "found";

        const status =
                item.status || "active";

        const statusText =
                status === "resolved"
                ? "Resolved"
                : "Active";

            const imageHTML =
                item.image
                    ? `
                        <img
                            src="${item.image}"
                            alt="${escapeHTML(
                                item.itemName
                            )}"
                            style="
                                width:100%;
                                height:100%;
                                object-fit:cover;
                            "
                        >
                    `
                    : getIcon(
                        item.category
                    );

            return `

                <div
                    class="item-card"
                    data-type="${escapeHTML(type)}"
                >

                    <div
                        class="item-image ${
                            statusClass === "lost"
                                ? "blue-bg"
                                : "green-bg"
                        }"
                    >

                        ${imageHTML}

                    </div>


                    <div class="item-content">

                        <div class="card-top">

                            <span
                                class="status ${statusClass}"
                            >
                                ● ${escapeHTML(
                                    type.toUpperCase()
                                )}
                            </span>

                            <span
                                   class="item-status ${
                                     status === "resolved"
                                        ? "resolved"
                                        : "active"
                }"
>
                         ${statusText}
                        </span>

                            <span class="category">

                                ${escapeHTML(
                                    item.category
                                )}

                            </span>

                        </div>


                        <h3>

                            ${escapeHTML(
                                item.itemName
                            )}

                        </h3>


                        <p class="description">

                            ${escapeHTML(
                                item.description
                            )}

                        </p>


                        <div class="item-info">

                            <span>

                                📍 ${escapeHTML(
                                    item.location
                                )}

                            </span>


                            <span>

                                📅 ${escapeHTML(
                                    item.date
                                )}

                            </span>

                        </div>


                        <button
                            class="view-button"
                            onclick="viewItem('${item._id}')"
                        >

                            View Details →

                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


// ==========================================
// CATEGORY ICONS
// ==========================================

function getIcon(category) {

    const icons = {

        "ID Card": "🪪",

        "Electronics": "📱",

        "Bag": "🎒",

        "Books": "📚",

        "Clothing": "👕",

        "Keys": "🔑",

        "Documents": "📄",

        "Other": "📦"

    };

    return (
        icons[category] ||
        "📦"
    );
}


// ==========================================
// FILTER ITEMS
// ==========================================

function filterItems() {

    const filter =
        document.getElementById(
            "filter"
        );

    if (!filter) return;

    const selectedValue =
        filter.value;

    if (selectedValue === "all") {

        displayItems(allItems);

        return;
    }

    const filteredItems =
        allItems.filter(
            item => {

                return (
                    item.type ===
                    selectedValue
                );

            }
        );

    displayItems(
        filteredItems
    );
}


// ==========================================
// SEARCH ITEMS
// ==========================================

function searchItems() {

    const searchInput =
        document.getElementById(
            "search"
        );

    if (!searchInput) return;

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();

    if (searchText === "") {

        displayItems(
            allItems
        );

        return;
    }

    const filteredItems =
        allItems.filter(
            item => {

                return (

                    (
                        item.itemName &&
                        item.itemName
                            .toLowerCase()
                            .includes(
                                searchText
                            )
                    )

                    ||

                    (
                        item.category &&
                        item.category
                            .toLowerCase()
                            .includes(
                                searchText
                            )
                    )

                    ||

                    (
                        item.location &&
                        item.location
                            .toLowerCase()
                            .includes(
                                searchText
                            )
                    )

                    ||

                    (
                        item.description &&
                        item.description
                            .toLowerCase()
                            .includes(
                                searchText
                            )
                    )

                );

            }
        );

    displayItems(
        filteredItems
    );
}


// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStats(items) {

    const lostCount =
        items.filter(
            item =>
                item.type === "Lost"
        ).length;

    const foundCount =
        items.filter(
            item =>
                item.type === "Found"
        ).length;


    const lostElement =
        document.getElementById(
            "lostCount"
        );

    const foundElement =
        document.getElementById(
            "foundCount"
        );


    if (lostElement) {

        lostElement.textContent =
            lostCount;

    }


    if (foundElement) {

        foundElement.textContent =
            foundCount;

    }
}


// ==========================================
// VIEW ITEM
// ==========================================

function viewItem(id) {

    window.location.href =
        "details.html?id=" +
        encodeURIComponent(id);
}

// ==========================================
// LOAD ITEM DETAILS
// ==========================================
async function loadItemDetails() {

    const container =
        document.getElementById(
            "detailsContainer"
        );

    if (!container) return;


    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        params.get("id");


    if (!id) {

        container.innerHTML = `

            <div class="loading-message">

                <h3>
                    Item not found
                </h3>

                <p>
                    No item ID was provided.
                </p>

            </div>

        `;

        return;
    }


    try {

        // ==========================================
        // LOAD ALL ITEMS
        // ==========================================

        const response =
            await fetch(
                "/api/items"
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load items"
            );

        }


        const items =
            await response.json();


        // ==========================================
        // FIND SELECTED ITEM
        // ==========================================

        const item =
            items.find(
                item =>
                    String(item._id) ===
                    String(id)
            );


        if (!item) {

            container.innerHTML = `

                <div class="loading-message">

                    <h3>
                        Item not found
                    </h3>

                    <p>
                        This item may have been removed.
                    </p>

                </div>

            `;

            return;
        }


        // ==========================================
        // CHECK CURRENT LOGGED-IN USER
        // ==========================================

        let currentUser = null;

        try {

            const userResponse =
                await fetch(
                    "/api/me"
                );


            if (userResponse.ok) {

                const userData =
                    await userResponse.json();

                currentUser =
                    userData.user || null;

            }

        } catch (userError) {

            console.error(
                "Error checking current user:",
                userError
            );

        }


        // ==========================================
        // CHECK OWNERSHIP
        // ==========================================

        const isOwner =
            currentUser &&
            item.userId &&
            String(currentUser._id || currentUser.id) ===
            String(item.userId);


        // ==========================================
        // ITEM TYPE
        // ==========================================

        const type =
            item.type || "Lost";


        const statusClass =
            type.toLowerCase() === "lost"
                ? "lost"
                : "found";


        // ==========================================
        // ITEM STATUS
        // ==========================================

        const itemStatus =
            item.status || "active";


        const statusText =
            itemStatus === "resolved"
                ? "Resolved"
                : "Active";


       
// ==========================================
// ITEM IMAGE
// ==========================================

const detailsImageHTML = item.image
    ? `
        <img
            src="${escapeHTML(item.image)}"
            alt="${escapeHTML(item.itemName || "Item image")}"
            style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            "
            onerror="this.style.display='none';"
        >
    `
    : getIcon(item.category);




        // ==========================================
        // OWNER ACTION BUTTONS
        // ==========================================

        let ownerActions = "";


        if (isOwner) {

            ownerActions = `

                <button
                    class="edit-button"
                    onclick="editItem('${item._id}')"
                >

                    ✏️ Edit Item

                </button>

            `;


            // Show Resolve button only
            // when item is still active

            if (itemStatus !== "resolved") {

                ownerActions += `

                    <button
                        class="resolve-button"
                        onclick="resolveItem('${item._id}')"
                    >

                        ✅ Mark as Resolved

                    </button>

                `;

            }


            ownerActions += `

                <button
                    class="delete-button"
                    onclick="deleteItem('${item._id}')"
                >

                    🗑️ Delete Item

                </button>

            `;

        }


        // ==========================================
        // DISPLAY DETAILS
        // ==========================================

        container.innerHTML = `

            <div class="details-card">


                <div class="details-icon">

                    ${detailsImageHTML}

                </div>


                <div class="details-content">


                    <span
                        class="status ${statusClass}"
                    >

                        ● ${escapeHTML(
                            type.toUpperCase()
                        )}

                    </span>


                    <span
                        class="item-status ${
                            itemStatus === "resolved"
                                ? "resolved"
                                : "active"
                        }"
                    >

                        ${statusText}

                    </span>


                    <h1>

                        ${escapeHTML(
                            item.itemName
                        )}

                    </h1>


                    <p class="details-description">

                        ${escapeHTML(
                            item.description
                        )}

                    </p>


                    <div class="details-info">


                        <div>

                            <strong>
                                Category
                            </strong>

                            <span>

                                ${escapeHTML(
                                    item.category
                                )}

                            </span>

                        </div>


                        <div>

                            <strong>
                                Location
                            </strong>

                            <span>

                                📍 ${escapeHTML(
                                    item.location
                                )}

                            </span>

                        </div>


                        <div>

                            <strong>
                                Date
                            </strong>

                            <span>

                                📅 ${escapeHTML(
                                    item.date
                                )}

                            </span>

                        </div>


                        <div>

                            <strong>
                                Contact
                            </strong>

                            <span>

                                📞 ${escapeHTML(
                                    item.contact
                                )}

                            </span>

                        </div>


                    </div>


                    <!-- ACTION BUTTONS -->

                    <div class="details-actions">


                        <a
                            href="index.html"
                            class="view-button"
                        >

                            ← Back to Items

                        </a>


                        ${ownerActions}


                    </div>


                </div>

            </div>

        `;


    } catch (error) {

        console.error(
            "Error loading item details:",
            error
        );


        container.innerHTML = `

            <div class="loading-message">

                <h3>
                    Unable to load item
                </h3>

                <p>
                    Please try again.
                </p>

            </div>

        `;

    }

}
// ==========================================
// EDIT ITEM
// ==========================================

async function editItem(id) {

    try {

        const response =
            await fetch(
                "/api/items"
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load items"
            );

        }


        const items =
            await response.json();


        const item =
            items.find(
                item =>
                    String(item._id) ===
                    String(id)
            );


        if (!item) {

            alert(
                "Item not found."
            );

            return;
        }


        const container =
            document.getElementById(
                "detailsContainer"
            );


        container.innerHTML = `

            <div class="edit-card">


                <h2>
                    ✏️ Edit Item
                </h2>


                <form
                    id="editForm"
                    class="edit-form"
                >


                    <label>
                        Item Type
                    </label>


                    <select
                        id="editType"
                    >

                        <option
                            value="Lost"
                            ${
                                item.type === "Lost"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Lost
                        </option>


                        <option
                            value="Found"
                            ${
                                item.type === "Found"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Found
                        </option>

                    </select>


                    <label>
                        Item Name
                    </label>


                    <input
                        type="text"
                        id="editItemName"
                        value="${escapeHTML(
                            item.itemName
                        )}"
                        required
                    >


                    <label>
                        Category
                    </label>


                    <input
                        type="text"
                        id="editCategory"
                        value="${escapeHTML(
                            item.category
                        )}"
                        required
                    >


                    <label>
                        Location
                    </label>


                    <input
                        type="text"
                        id="editLocation"
                        value="${escapeHTML(
                            item.location
                        )}"
                        required
                    >


                    <label>
                        Date
                    </label>


                    <input
                        type="date"
                        id="editDate"
                        value="${escapeHTML(
                            item.date
                        )}"
                        required
                    >


                    <label>
                        Description
                    </label>


                    <textarea
                        id="editDescription"
                        rows="5"
                        required
                    >${escapeHTML(
                        item.description
                    )}</textarea>


                    <label>
                        Contact
                    </label>


                    <input
                        type="text"
                        id="editContact"
                        value="${escapeHTML(
                            item.contact
                        )}"
                        required
                    >


                    <div
                        class="details-actions"
                    >


                        <button
                            type="submit"
                            class="edit-button"
                        >

                            💾 Save Changes

                        </button>


                        <button
                            type="button"
                            class="delete-button"
                            onclick="loadItemDetails()"
                        >

                            Cancel

                        </button>


                    </div>


                </form>


            </div>

        `;


        document
            .getElementById(
                "editForm"
            )
            .addEventListener(
                "submit",
                function(event) {

                    event.preventDefault();

                    saveEditedItem(id);

                }
            );


    } catch (error) {

        console.error(
            "Error editing item:",
            error
        );


        alert(
            "Unable to edit item."
        );

    }
}


// ==========================================
// SAVE EDITED ITEM
// ==========================================

async function saveEditedItem(id) {

    const updatedItem = {

        type:
            document.getElementById(
                "editType"
            ).value,

        itemName:
            document.getElementById(
                "editItemName"
            ).value,

        category:
            document.getElementById(
                "editCategory"
            ).value,

        location:
            document.getElementById(
                "editLocation"
            ).value,

        date:
            document.getElementById(
                "editDate"
            ).value,

        description:
            document.getElementById(
                "editDescription"
            ).value,

        contact:
            document.getElementById(
                "editContact"
            ).value

    };


    try {

        const response =
            await fetch(
                `/api/items/${id}`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            updatedItem
                        )

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Update failed."
                )
            );

            return;
        }


        alert(
            "✅ Item updated successfully!"
        );


        loadItemDetails();


    } catch (error) {

        console.error(
            "Error updating item:",
            error
        );


        alert(
            "❌ Server connection error."
        );

    }
}

// ==========================================
// MARK ITEM AS RESOLVED
// ==========================================

async function resolveItem(itemId) {

    const confirmResolve =
        confirm(
            "Are you sure you want to mark this item as resolved?"
        );

    if (!confirmResolve) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/items/${itemId}/resolve`,
                {
                    method: "PUT"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Failed to mark item as resolved."
                )
            );

            return;
        }


        alert(
            "✅ " +
            (
                data.message ||
                "Item marked as resolved!"
            )
        );


        // Reload the details page
        // so the status and buttons update

        await loadItemDetails();


    } catch (error) {

        console.error(
            "Resolve item error:",
            error
        );


        alert(
            "❌ Server connection error."
        );

    }

}

// ==========================================
// DELETE ITEM
// ==========================================

async function deleteItem(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this item?"
        );


    if (!confirmDelete) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/items/${id}`,
                {

                    method: "DELETE"

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Delete failed."
                )
            );

            return;
        }


        alert(
            "🗑️ Item deleted successfully!"
        );


        window.location.href =
            "index.html";


    } catch (error) {

        console.error(
            "Error deleting item:",
            error
        );


        alert(
            "❌ Server connection error."
        );

    }
}


// ==========================================
// SUBMIT REPORT FORM
// ==========================================

async function submitReportForm(form) {

    // CHECK LOGIN FIRST

    try {

        const loginCheck =
            await fetch(
                "/api/me"
            );


        if (!loginCheck.ok) {

            alert(
                "🔐 Please login before reporting an item."
            );

            window.location.href =
                "login.html";

            return;

        }

    } catch (error) {

        console.error(
            "Login check error:",
            error
        );

        alert(
            "❌ Unable to check login status."
        );

        return;

    }


    const selectedType =
        document.querySelector(
            'input[name="type"]:checked'
        );


    if (!selectedType) {

        alert(
            "Please select Lost or Found."
        );

        return;

    }


    const formData =
        new FormData();


    formData.append(
        "type",
        selectedType.value
    );


    formData.append(
        "itemName",
        document.getElementById(
            "itemName"
        ).value
    );


    formData.append(
        "category",
        document.getElementById(
            "category"
        ).value
    );


    formData.append(
        "location",
        document.getElementById(
            "location"
        ).value
    );


    formData.append(
        "date",
        document.getElementById(
            "date"
        ).value
    );


    formData.append(
        "description",
        document.getElementById(
            "description"
        ).value
    );


    formData.append(
        "contact",
        document.getElementById(
            "contact"
        ).value
    );


    const imageInput =
        document.getElementById(
            "image"
        );


    if (
        imageInput &&
        imageInput.files.length > 0
    ) {

        formData.append(
            "image",
            imageInput.files[0]
        );

    }


    try {

        const response =
            await fetch(
                "/api/items",
                {

                    method: "POST",

                    body: formData

                }
            );


        const data =
            await response.json();


        if (response.ok) {

            alert(
                "✅ " +
                data.message
            );


            form.reset();


            window.location.href =
                "index.html";


        } else {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Failed to report item."
                )
            );

        }


    } catch (error) {

        console.error(
            "Error:",
            error
        );


        alert(
            "❌ Server connection error."
        );

    }
}


// ==========================================
// USER REGISTRATION
// ==========================================

const registerForm =
    document.getElementById(
        "registerForm"
    );


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const name =
                document.getElementById(
                    "name"
                ).value.trim();


            const email =
                document.getElementById(
                    "email"
                ).value.trim();


            const password =
                document.getElementById(
                    "password"
                ).value;


            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


            // CHECK PASSWORD MATCH

            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "❌ Passwords do not match."
                );

                return;

            }


            // CHECK PASSWORD LENGTH

            if (
                password.length < 6
            ) {

                alert(
                    "❌ Password must be at least 6 characters."
                );

                return;

            }


            try {

                const response =
                    await fetch(
                        "/api/register",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    name:
                                        name,

                                    email:
                                        email,

                                    password:
                                        password

                                })

                        }
                    );


                const data =
                    await response.json();


                if (response.ok) {

                    alert(
                        "✅ " +
                        data.message
                    );


                    registerForm.reset();


                    window.location.href =
                        "login.html";


                } else {

                    alert(
                        "❌ " +
                        (
                            data.message ||
                            "Registration failed."
                        )
                    );

                }


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                alert(
                    "❌ Server connection error."
                );

            }

        }
    );

}


// ==========================================
// USER LOGIN
// ==========================================

const loginForm =
    document.getElementById(
        "loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const email =
                document.getElementById(
                    "loginEmail"
                ).value.trim();


            const password =
                document.getElementById(
                    "loginPassword"
                ).value;


            // CHECK EMPTY FIELDS

            if (
                !email ||
                !password
            ) {

                alert(
                    "❌ Please enter email and password."
                );

                return;

            }


            try {

                const response =
                    await fetch(
                        "/api/login",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    email:
                                        email,

                                    password:
                                        password

                                })

                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "Login response:",
                    data
                );


                if (response.ok) {

                    alert(
                        "✅ " +
                        data.message
                    );


                    // GO TO HOME PAGE

                    window.location.href =
                        "/index.html";


                } else {

                    alert(
                        "❌ " +
                        (
                            data.message ||
                            "Login failed."
                        )
                    );

                }


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                alert(
                    "❌ Server connection error."
                );

            }

        }
    );

}


// ==========================================
// CHECK CURRENT USER
// ==========================================

async function checkCurrentUser() {

    try {

        const response =
            await fetch(
                "/api/me"
            );


        if (!response.ok) {

            return null;

        }


        const data =
            await response.json();


        return data.user;


    } catch (error) {

        console.error(
            "Error checking user:",
            error
        );


        return null;

    }
}
    // ==========================================
// PROTECT PROFILE PAGE
// ==========================================

async function protectProfilePage() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();

    // Only run on profile.html
    if (currentPage !== "profile.html") {
        return;
    }

    try {

        const response =
            await fetch("/api/me");

        if (!response.ok) {

            alert(
                "🔐 Please login to access your profile."
            );

            window.location.href =
                "login.html";

            return;
        }

    } catch (error) {

        console.error(
            "Profile authentication error:",
            error
        );

        alert(
            "❌ Unable to verify login."
        );

        window.location.href =
            "login.html";
    }
}

    // ==========================================
// PROTECT REPORT PAGE
// ==========================================

async function protectReportPage() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();

    // Only run on report.html
    if (currentPage !== "report.html") {
        return;
    }

    try {

        const response =
            await fetch("/api/me");

        if (!response.ok) {

            alert(
                "🔐 Please login to report a lost or found item."
            );

            window.location.href =
                "login.html";

            return;
        }

    } catch (error) {

        console.error(
            "Report page authentication error:",
            error
        );

        alert(
            "❌ Unable to verify login."
        );

        window.location.href =
            "login.html";
    }
}
// ==========================================
// LOGOUT
// ==========================================

async function logoutUser() {

    try {

        const response =
            await fetch(
                "/api/logout",
                {

                    method: "POST"

                }
            );


        const data =
            await response.json();


        if (response.ok) {

            alert(
                "✅ " +
                data.message
            );


            window.location.href =
                "index.html";


        } else {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Logout failed."
                )
            );

        }


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        alert(
            "❌ Server connection error."
        );

    }
}


// ==========================================
// SECURITY HELPER
// ==========================================

function escapeHTML(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}

// ==========================================
// DYNAMIC NAVIGATION
// ==========================================

async function updateNavigation() {

    const navLinks =
        document.querySelector(".nav-links");

    if (!navLinks) return;

    try {

        const response =
            await fetch("/api/me");

        let menuHTML = "";

        if (response.ok) {

            // ==================================
            // LOGGED-IN USER
            // ==================================

            menuHTML = `

                <a href="index.html">
                    Home
                </a>

                <a href="index.html#items">
                    Browse Items
                </a>

                <a href="index.html#how-it-works">
                    How It Works
                </a>

                <a href="index.html#about">
                    About
                </a>

                <a href="dashboard.html">
                    Dashboard
                </a>

                <a href="my-reports.html">
                    My Reports
                </a>

                <a href="profile.html">
                    Profile
                </a>

                <a
                    href="report.html"
                    class="nav-report-btn"
                >
                    + Report Item
                </a>

                <a
                    href="#"
                    onclick="logoutUser(); return false;"
                >
                    Logout
                </a>

            `;

        } else {

            // ==================================
            // LOGGED-OUT USER
            // ==================================

            menuHTML = `

                <a href="index.html">
                    Home
                </a>

                <a href="index.html#items">
                    Browse Items
                </a>

                <a href="index.html#how-it-works">
                    How It Works
                </a>

                <a href="index.html#about">
                    About
                </a>

                <a href="login.html">
                    Login
                </a>

                <a href="register.html">
                    Register
                </a>

                <a
                    href="report.html"
                    class="nav-report-btn"
                >
                    + Report Item
                </a>

            `;
        }


        // ==================================
        // CREATE NAVIGATION
        // ==================================

        navLinks.innerHTML = `

            <div class="nav-menu">

                ${menuHTML}

            </div>

            <button
                class="mobile-menu-toggle"
                type="button"
                onclick="toggleMobileMenu()"
                aria-label="Open navigation menu"
            >
                ☰
            </button>

        `;

    } catch (error) {

        console.error(
            "Navigation error:",
            error
        );

    }
}


// ==========================================
// MOBILE MENU
// ==========================================

function toggleMobileMenu() {

    const menu =
        document.querySelector(".nav-menu");

    const button =
        document.querySelector(
            ".mobile-menu-toggle"
        );

    if (!menu || !button) return;


    menu.classList.toggle(
        "mobile-menu-open"
    );


    if (
        menu.classList.contains(
            "mobile-menu-open"
        )
    ) {

        button.innerHTML = "✕";

    } else {

        button.innerHTML = "☰";

    }
}

document.addEventListener(
    "DOMContentLoaded",
    function() {
        
        updateNavigation();
        loadItems();

        loadItemDetails();
        loadMyReports();
        loadProfile();
        loadProfileStats();
        protectProfilePage();
        protectReportPage();

        // ==================================
        // REPORT FORM
        // ==================================

        const form =
            document.getElementById(
                "itemForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                function(event) {

                    event.preventDefault();

                    submitReportForm(
                        form
                    );

                }
            );

        }

    }
);
// ==========================================
// LOAD MY REPORTS
// ==========================================

async function loadMyReports() {

    const container =
        document.getElementById(
            "myReportsContainer"
        );

    if (!container) return;


    try {

        // CHECK LOGIN

        const userResponse =
            await fetch("/api/me");


        if (!userResponse.ok) {

            alert(
                "🔐 Please login to view your reports."
            );

            window.location.href =
                "login.html";

            return;

        }


        // GET USER'S REPORTS

        const response =
            await fetch(
                "/api/my-reports"
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load reports."
            );

        }


        if (data.length === 0) {

            container.innerHTML = `

                <div class="loading-message">

                    <div class="loading-icon">
                        📦
                    </div>

                    <h3>
                        No Reports Yet
                    </h3>

                    <p>
                        You have not reported any lost
                        or found items yet.
                    </p>

                    <br>

                    <a
                        href="report.html"
                        class="view-button"
                    >
                        + Report an Item
                    </a>

                </div>

            `;

            return;

        }


        // DISPLAY USER REPORTS

        container.innerHTML =
            data.map(item => {

                const type =
                    item.type || "Lost";


                const statusClass =
                    type.toLowerCase() === "lost"
                        ? "lost"
                        : "found";


                const imageHTML =
                    item.image

                        ? `
                            <img
                                src="${item.image}"
                                alt="${escapeHTML(
                                    item.itemName
                                )}"
                                style="
                                    width:100%;
                                    height:100%;
                                    object-fit:cover;
                                "
                            >
                        `

                        : getIcon(
                            item.category
                        );


                return `

                    <div class="item-card">

                        <div
                            class="item-image ${
                                statusClass === "lost"
                                    ? "blue-bg"
                                    : "green-bg"
                            }"
                        >

                            ${imageHTML}

                        </div>


                        <div class="item-content">

                            <div class="card-top">

                                <span
                                    class="status ${statusClass}"
                                >

                                    ● ${escapeHTML(
                                        type.toUpperCase()
                                    )}

                                </span>


                                <span class="category">

                                    ${escapeHTML(
                                        item.category
                                    )}

                                </span>

                            </div>


                            <h3>

                                ${escapeHTML(
                                    item.itemName
                                )}

                            </h3>


                            <p class="description">

                                ${escapeHTML(
                                    item.description
                                )}

                            </p>


                            <div class="item-info">

                                <span>

                                    📍 ${escapeHTML(
                                        item.location
                                    )}

                                </span>


                                <span>

                                    📅 ${escapeHTML(
                                        item.date
                                    )}

                                </span>

                            </div>


                            <button
                                class="view-button"
                                onclick="viewItem('${item._id}')"
                            >

                                View Details →

                            </button>

                        </div>

                    </div>

                `;

            }).join("");


    } catch (error) {

        console.error(
            "Error loading my reports:",
            error
        );


        container.innerHTML = `

            <div class="loading-message">

                <div class="loading-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load reports
                </h3>

                <p>
                    Please try again.
                </p>

            </div>

        `;

    }

}
// ==========================================
// LOAD USER PROFILE
// ==========================================

async function loadProfile() {

    const profileName =
        document.getElementById("profileName");

    const profileEmail =
        document.getElementById("profileEmail");

    const accountName =
        document.getElementById("accountName");

    const accountEmail =
        document.getElementById("accountEmail");

    // Profile page not open
    if (
        !profileName &&
        !profileEmail &&
        !accountName &&
        !accountEmail
    ) {
        return;
    }

    try {

        const user =
            await checkCurrentUser();

        // User is not logged in
        if (!user) {

            window.location.href =
                "login.html";

            return;
        }

        // Display user information

        const name =
            user.name || "CampusFind User";

        const email =
            user.email || "No email available";


        if (profileName) {
            profileName.textContent = name;
        }

        if (profileEmail) {
            profileEmail.textContent = email;
        }

        if (accountName) {
            accountName.textContent = name;
        }

        if (accountEmail) {
            accountEmail.textContent = email;
        }


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

    }

}
// ==========================================
// LOAD PROFILE STATISTICS
// ==========================================

async function loadProfileStats() {

    const totalReports =
        document.getElementById("totalReports");

    const lostReports =
        document.getElementById("lostReports");

    const foundReports =
        document.getElementById("foundReports");

    // Profile page not open
    if (
        !totalReports &&
        !lostReports &&
        !foundReports
    ) {
        return;
    }

    try {

        const response =
            await fetch("/api/my-reports");

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to load statistics."
            );
        }

        // Total reports
        const total = data.length;

        // Lost reports
        const lost =
            data.filter(
                item =>
                    item.type &&
                    item.type.toLowerCase() === "lost"
            ).length;

        // Found reports
        const found =
            data.filter(
                item =>
                    item.type &&
                    item.type.toLowerCase() === "found"
            ).length;


        // Display statistics

        if (totalReports) {
            totalReports.textContent = total;
        }

        if (lostReports) {
            lostReports.textContent = lost;
        }

        if (foundReports) {
            foundReports.textContent = found;
        }

    } catch (error) {

        console.error(
            "Profile statistics error:",
            error
        );

    }
}