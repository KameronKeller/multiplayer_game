const LOCAL_SERVER_BASE_URL = "http://localhost:8080";
const LOCAL_CLIENT_BASE_URL = "http://localhost:3001";
const PROD_SERVER_BASE_URL =
  "https://super-mega-backend-512263420060.us-central1.run.app";
const PROD_CLIENT_BASE_URL =
  "https://storage.googleapis.com/super-mega-game-frontend";

const LOCAL_DEV = true;

const joinGame = async (e) => {
  e.preventDefault();

  const characterForm = document.getElementById("character-form");
  const formData = new FormData(characterForm);
  const character = formData.get("character");

  const serverBaseUrl = LOCAL_DEV
    ? LOCAL_SERVER_BASE_URL
    : PROD_SERVER_BASE_URL;

  const clientBaseUrl = LOCAL_DEV
    ? LOCAL_CLIENT_BASE_URL
    : PROD_CLIENT_BASE_URL;
  try {
    const response = await fetch(`${serverBaseUrl}/join-game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ character }),
    });

    const data = await response.json();

    if (data.status === "success") {
      window.location.href = `${clientBaseUrl}/index.html?token=${data.token}&character=${character}`;
    } else {
      console.error("Failed to join game:", data.message);
    }
  } catch (error) {
    console.error("Error submitting form:", error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const characterForm = document.getElementById("character-form");
  characterForm.addEventListener("submit", joinGame);
});
