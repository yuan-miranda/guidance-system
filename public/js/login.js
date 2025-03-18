async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const data = {
        email,
        password
    };

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const token = await response.text();
            localStorage.setItem('token', token);

            // prompt if user wants to change password if password has 1234 string (initial password)
            if (password.includes('1234')) {
                if (confirm('You are using the initial password. Do you want to change it?')) {
                    try {
                        const newPassword = prompt('Enter new password');
                        const data = {
                            email,
                            password: newPassword
                        };

                        const response = await fetch('/changepasswd', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(data)
                        });

                        if (response.ok) {
                            alert('Password changed successfully');
                        } else {
                            alert('Failed to change password');
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
            window.location.href = '/';
        } else alert('Invalid email or password');
    }
    catch (error) {
        console.error(error);
    }
}

function clearLoginInputs() {
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginDiscardButton').disabled = true;
    document.getElementById('loginSubmitButton').disabled = true;
}

function openLoginModal() {
    const loginDiscardButton = document.getElementById('loginDiscardButton');
    const loginSubmitButton = document.getElementById('loginSubmitButton');
    const loginEmail = document.getElementById('loginEmail');
    loginDiscardButton.disabled = false;
    loginSubmitButton.disabled = false;
    loginEmail.focus();
}


// <div class="modal fade" id="manageAdminModal" tabindex="-1" aria-labelledby="manageAdminModalLabel" aria-hidden="true">
//     <div class="modal-dialog modal-dialog-centered">
//         <div class="modal-content">
//             <div class="modal-header">
//                 <h1 class="modal-title fs-5" id="manageAdminModalLabel">Manage Users</h1>
//                 <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
//             </div>
//             <div class="modal-body">
//                 <h5>Superusers</h5>
//                 <ul id="superuserList" class="list-group mb-3"></ul>

//                 <h5>Add New Superuser</h5>
//                 <div class="input-group">
//                     <input type="email" id="newSuperuserEmail" class="form-control" placeholder="Enter email" required>
//                     <input type="password" id="newSuperuserPassword" class="form-control" placeholder="Enter password" required>
//                     <button class="btn btn-success" id="addSuperuserButton">Add</button>
//                 </div>
//             </div>
//             <div class="modal-footer">
//                 <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
//             </div>
//         </div>
//     </div>
// </div>


function loginEventListener() {
    document.getElementById('loginModal').addEventListener('shown.bs.modal', () => openLoginModal());
    document.getElementById('loginModal').addEventListener('hidden.bs.modal', () => clearLoginInputs());
    document.getElementById('loginDiscardButton').addEventListener('click', () => clearLoginInputs());
    document.getElementById('loginSubmitButton').addEventListener('click', () => login());

    
}

function logoutEventListener() {
    document.getElementById('logoutButton').addEventListener('click', () => logout());
}

function logout() {
    // prompt user to confirm logout
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        window.location.href = '/';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loginEventListener();
    logoutEventListener();
});