let submitBtn = document.getElementById("submit-btn");
submitBtn.style.display = "none"
let success = false;
let globalPassword;
let userAvailable = false;
function validating() {
}


let password = document.getElementById("password");
password.addEventListener("keyup", (e) => {
    let errorSpan = document.getElementById("perror");
    let spError = document.getElementById("sperror");
    let pval = e.target.value;

    var specialCharPattern = /[!@#$%^&*()_+\-={}\[\]:;<>?,./~`|\\]/;
    console.log(specialCharPattern.test(pval));
    if (specialCharPattern.test(pval)) {
        errorSpan.innerText = "";
        errorSpan.classList.add("hidden")
    }else{
        errorSpan.style.color = "red"
        errorSpan.innerText = `\nThe password must contain one special character`
        errorSpan.classList.remove("hidden")
    }


    if (pval.length < 8 && pval.length > 0) {
        errorSpan.style.color = "red"
        errorSpan.innerText += `\nThe password you entered is less than 8 characters`
        errorSpan.classList.remove("hidden")
        success = false
        activateSubmitButton();

    } else if (pval.length >= 8) {
        globalPassword = e.target.value
        errorSpan.innerText = ""
        errorSpan.classList.add("hidden")
        success = true;
        activateSubmitButton();

    }
    

})

let repassword = document.getElementById("repassword");
repassword.addEventListener("keyup", (e) => {
    let errorSpan = document.getElementById("reerror");
    let pval = e.target.value;
    if (pval != globalPassword) {
        errorSpan.style.color = "red"
        errorSpan.innerText = `The password you entered earlier and this does not match`
        errorSpan.classList.remove("hidden")
        success = false
        activateSubmitButton();
    }
    else if (pval == globalPassword) {
        errorSpan.innerText = ""
        errorSpan.classList.add("hidden")
        success = true
        activateSubmitButton();
    }

})

document.getElementById("password").addEventListener("focus", () => {
    document.getElementById("instruction-card").classList.remove("hidden")
})

document.getElementById("repassword").addEventListener("blur", () => {
    document.getElementById("instruction-card").classList.add("hidden")
})
function removeSpan() {
    document.getElementById("error").innerHTML = "";
}

async function checkIfExistsEmail(e, event) {
    let userEntered = e.value;
    let startStatus = false
    if(event.key == "@"){
        startStatus = true
    }
    
    let ans = await fetch("http://localhost:3001/check-user-email", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: userEntered
        })
    })
    let data = await ans.json();
    if (data["status"] == "not" && userEntered != "") {
        document.getElementById("email_available").classList.remove("hidden")
        document.getElementById("email_unavailable").classList.add("hidden")
        userAvailable = true;
        activateSubmitButton();
    } else if (data["status"] == "exist" && userEntered != "") {
        document.getElementById("email_available").classList.add("hidden")
        document.getElementById("email_unavailable").classList.remove("hidden")
        userAvailable = false;
        activateSubmitButton();
    } else {
        userAvailable = false;
        document.getElementById("email_available").classList.add("hidden")
        document.getElementById("email_unavailable").classList.add("hidden")
        activateSubmitButton();
    }
}
async function checkIfExists(e) {
    let userEntered = e.value;

    let ans = await fetch("http://localhost:3001/check-user", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: userEntered
        })
    })
    let data = await ans.json();
    if (data["status"] == "not" && userEntered != "") {
        document.getElementById("available").classList.remove("hidden")
        document.getElementById("unavailable").classList.add("hidden")
        userAvailable = true;
        activateSubmitButton();
    } else if (data["status"] == "exist" && userEntered != "") {
        document.getElementById("available").classList.add("hidden")
        document.getElementById("unavailable").classList.remove("hidden")
        userAvailable = false;
        activateSubmitButton();
    } else {
        userAvailable = false;
        document.getElementById("available").classList.add("hidden")
        document.getElementById("unavailable").classList.add("hidden")
        activateSubmitButton();
    }
}

function emptyFields(){
    let password = document.getElementById("password").value;
    let repassword = document.getElementById("repassword").value;
    let email = document.getElementById("email").value;
    let name = document.getElementById("name").value;
    

}

function activateSubmitButton(){
    console.log(success, userAvailable);
    if(success && userAvailable){
        submitBtn.style.display = "block"
    }else{
        submitBtn.style.display = "none"
    }
}