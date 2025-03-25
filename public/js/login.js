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
            const email = await response.text();

            const response2 = await fetch(`/getAccess?email=${email}`);
            const accessData = await response2.json();
            const access = accessData.access;

            localStorage.setItem('email', email);
            localStorage.setItem('access', access);

            // prompt if user wants to change password if password has 1234 string (initial password)
            if (password.includes('1234')) {
                if (confirm('You are using the initial password. Do you want to change it?')) {
                    try {
                        const newPassword = prompt('Enter new password');
                        if (newPassword === null) return;
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
        if (localStorage.getItem('email')) {
            const manageAdminModal = new bootstrap.Modal(document.getElementById('manageAdminModal'));
            manageAdminModal.show();
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();

            // update access on local storage
            const response = await fetch(`/getAccess?email=${localStorage.getItem('email')}`);
            const accessData = await response.json();
            localStorage.setItem('access', accessData.access);
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
                const emailText = (user.email.length > 20 ? user.email.substring(0, 17) + '...' : user.email);
                
                if (user.email === localStorage.getItem('email')) {
                    li.style.fontWeight = 'bold';
                    li.textContent = emailText + ' (You)';
                }
                else li.textContent = emailText;
                
                const div = document.createElement('div');
                const deleteButton = document.createElement('button');
                const makeAccess0Button = document.createElement('button');
                const makeAccess1Button = document.createElement('button');
                deleteButton.className = 'btn btn-danger';
                deleteButton.textContent = 'Delete';
                deleteButton.style.marginLeft = '5px';
                makeAccess0Button.className = 'btn btn-warning';
                makeAccess0Button.textContent = 'Limited Access';
                makeAccess1Button.className = 'btn btn-success';
                makeAccess1Button.textContent = 'Full Access';
                div.className = 'd-flex justify-content-between align-items-center';
                li.title = user.email;

                deleteButton.addEventListener('click', async () => {
                    if (confirm(`Are you sure you want to delete ${user.email}?`)) {
                        try {
                            const response = await fetch('/deletesuperuser', {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    email: user.email,
                                    requesterEmail: localStorage.getItem('email'),
                                }),
                            });
                            
                            if (response.ok) {
                                alert('User deleted successfully');

                                if (user.email === localStorage.getItem('email')) {
                                    localStorage.removeItem('email');
                                    localStorage.removeItem('access');
                                    alert('You have been logged out because your account was deleted.');
                                    window.location.href = '/';
                                }

                                location.reload();
                            } else alert('Failed to delete user');
                        } catch (error) {
                            console.error(error);
                        }
                    }
                });

                makeAccess0Button.addEventListener('click', async () => {
                    if (confirm(`Are you sure you want to make ${user.email}'s FULL ACCESS?`)) {
                        try {
                            const response = await fetch('/makeaccess0', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    email: user.email,
                                    requesterEmail: localStorage.getItem('email'),
                                }),
                            });

                            if (response.ok) {
                                if (user.email === localStorage.getItem('email')) localStorage.setItem('access', 0);
                                alert('Access changed successfully');
                                location.reload();
                            } else alert('Failed to change access');
                        } catch (error) {
                            console.error(error);
                        }
                    }
                });

                makeAccess1Button.addEventListener('click', async () => {
                    if (confirm(`Are you sure you want to make ${user.email}'s LIMITED ACCESS?`)) {
                        try {
                            const response = await fetch('/makeaccess1', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    email: user.email,
                                    requesterEmail: localStorage.getItem('email'),
                                }),
                            });

                            if (response.ok) {
                                if (user.email === localStorage.getItem('email')) localStorage.setItem('access', 1);
                                alert('Access changed successfully');
                                location.reload();
                            } else alert('Failed to change access');
                        } catch (error) {
                            console.error(error);
                        }
                    }
                });

                if (localStorage.getItem('access') == 0) {
                    li.addEventListener('click', async (event) => {
                        if (event.target === li) {
                            try {
                                const response = await fetch(`/getPassword?email=${user.email}`);
                                if (response.ok) {
                                    const { password } = await response.json();
                                    const newPassword = prompt('Enter new password', password);
                                    if (newPassword !== null && newPassword !== password) {
                                        const updateResponse = await fetch('/changepasswd', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                                email: user.email,
                                                password: newPassword,
                                                requesterEmail: localStorage.getItem('email'),
                                            }),
                                        });

                                        if (updateResponse.ok) {
                                            alert('Password updated successfully');
                                        } else {
                                            alert('Failed to update password');
                                        }
                                    }
                                } else alert('Failed to retrieve password');
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    });
                }

                if (user.access == 1) div.appendChild(makeAccess0Button);
                else div.appendChild(makeAccess1Button);

                li.appendChild(div);
                div.appendChild(deleteButton);
                superuserList.appendChild(li);
            });

            addSuperuserButton.addEventListener('click', async () => {
                const email = newSuperuserEmail.value;
                const password = newSuperuserPassword.value;
                const access = newSuperuserAccess.value;
                const requesterEmail = localStorage.getItem('email');

                if (!email || !password || !access) return alert('Please fill all fields');

                const data = {
                    email,
                    password,
                    access,
                    requesterEmail
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
                    else if (response.status === 403) alert('You do not have permission to add users');
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
        localStorage.removeItem('email');
        localStorage.removeItem('access');
        window.location.href = '/';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loginEventListener();
    logoutEventListener();
});