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