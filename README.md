# SVD Movie Recommender System

An interactive web application demonstrating Singular Value Decomposition (SVD) for collaborative filtering and movie recommendations. Built as a class project for Linear Algebra.

👉 **[Live Demo](https://flashj8-github-io.vercel.app/)**

---

## 🎯 Project Goals

1. **Understand Singular Value Decomposition (SVD):** Explore how low-rank matrix approximations decompose user rating matrices to uncover latent preference factors and predict missing ratings.
2. **Web Development & Deployment Basics:** Learn the fundamentals of building a web application using React and Tailwind CSS, and hosting/publishing it online via Vercel and GitHub.

---

## 📐 How SVD Works

The user–movie ratings matrix $R$ is decomposed into three matrices:

$$R \approx U \cdot \Sigma \cdot V^T$$

* **$U$ (User–Feature Matrix):** Maps users to $k$ latent features (e.g., preference for action vs. animation).
* **$\Sigma$ (Singular Values):** A diagonal matrix representing the importance or weight of each latent feature.
* **$V^T$ (Movie–Feature Matrix):** Maps movies to the $k$ latent features.

By truncating the rank to $k$ (e.g., $k=3$), the model strips away minor variations and noise, allowing us to reconstruct the matrix and predict unrated cells to generate user recommendations.

---

## ✨ Interactive Features

* **Adjustable SVD Rank ($k$):** Change the rank slider dynamically to observe how truncation affects reconstruction energy and prediction accuracy.
* **Live User Ratings:** Click on movie ratings in the user–item matrix to edit scores and watch recommended movies update in real time.
* **Visualizations:**
  * **Heatmap Comparison:** Original ratings vs. SVD-predicted ratings side-by-side.
  * **2D Latent Space:** Scatter plot mapping users and movies in reduced component space.
  * **Singular Value Energy:** Cumulative variance distribution across latent components.

---

## 🛠️ Built With

* **Frontend:** React, Tailwind CSS
* **Math / SVD Engine:** Custom matrix decomposition implementation
* **Deployment:** Hosted on Vercel / GitHub Pages
