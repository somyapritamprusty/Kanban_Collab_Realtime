// utils/user.js
export function getUser() {
  let user = localStorage.getItem("kanbanUser");
  if (!user) {
    const random = "User" + Math.floor(Math.random() * 1000);
    user = JSON.stringify({ id: crypto.randomUUID(), name: random });
    localStorage.setItem("kanbanUser", user);
  }
  return JSON.parse(user);
}
