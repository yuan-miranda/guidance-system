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
}

function openLoginModal() {
    const loginDiscardButton = document.getElementById('loginDiscardButton');
    const loginSubmitButton = document.getElementById('loginSubmitButton');
    const loginEmail = document.getElementById('loginEmail');
    loginDiscardButton.disabled = false;
    loginSubmitButton.disabled = false;
    loginEmail.focus();
}

function loginEventListener() {
    document.getElementById('loginModal').addEventListener('shown.bs.modal', () => openLoginModal());
    document.getElementById('loginModal').addEventListener('hidden.bs.modal', () => clearLoginInputs());
    document.getElementById('loginDiscardButton').addEventListener('click', () => clearLoginInputs());
    document.getElementById('loginSubmitButton').addEventListener('click', () => login());

    document.getElementById('manageAdminButton').addEventListener('click', async () => {
        if (localStorage.getItem('token')) {
            const manageAdminModal = new bootstrap.Modal(document.getElementById('manageAdminModal'));
            manageAdminModal.show();
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();
        }
        else return alert('You must be logged in to manage users');
        
        const superuserList = document.getElementById('superuserList');
        const newSuperuserEmail = document.getElementById('newSuperuserEmail');
        const newSuperuserPassword = document.getElementById('newSuperuserPassword');
        const addSuperuserButton = document.getElementById('addSuperuserButton');

        try {
            const response = await fetch('/getsuperusers');
            const usersData = await response.json();

            superuserList.innerHTML = '';
            usersData.forEach(user => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.textContent = user.email;
                const deleteButton = document.createElement('button');
                deleteButton.className = 'btn btn-danger';
                deleteButton.textContent = 'Delete';
                
                deleteButton.addEventListener('click', async () => {
                    if (confirm(`Are you sure you want to delete ${user.email}?`)) {
                        try {
                            const response = await fetch(`/deletesuperuser?email=${user.email}`, {
                                method: 'DELETE'
                            });
                            if (response.ok) {
                                alert('User deleted successfully');
                                location.reload();
                            } else {
                                alert('Failed to delete user');
                            }
                        } catch (error) {
                            console.error(error);
                        }
                    }
                });

                li.appendChild(deleteButton);
                superuserList.appendChild(li);
            });

            addSuperuserButton.addEventListener('click', async () => {
                const email = newSuperuserEmail.value;
                const password = newSuperuserPassword.value;

                const data = {
                    email,
                    password
                };

                try {
                    const response = await fetch('/addsuperuser', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        alert('User added successfully');
                        location.reload();
                    } else if (response.status === 409) alert('User already exists');
                    else alert('Failed to add user');
                } catch (error) {
                    console.error(error);
                }
            });
        } catch (error) {
            console.error(error);
        }
    });
    
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