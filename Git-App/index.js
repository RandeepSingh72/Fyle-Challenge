let currentPage = 1;
let perPage = 10;
let maxPerPage = 100;
let totalRepos = 0;
let repositories = [];
let currentUser = ''
const userbtn = document.querySelector('#userbtn')

$(document).ready(function() {

  $("#prevBtn").on("click", function() {
      if (currentPage > 1) {
          currentPage--;
          getRepositories();
      }
  });

  $("#nextBtn").on("click", function() {
      if (currentPage < totalRepos) {
          currentPage++;
          getRepositories();
      }
  });

  $("#perPageSelect").on("change", function() {
      perPage = parseInt($(this).val());
      currentPage = 1;
      getRepositories();
  });

  $("#search").on("input", function() {
      filterRepositories();
  });

  $("#perPageSelect").on("change", function() {
    perPage = parseInt($(this).val());
    currentPage = 1;
    getRepositories();
});

});

document.getElementById("userbtn").addEventListener("click", function() {
  getRepositories();
  fetchGitHubUser(); 
});

async function fetchGitHubUser() {
  const username = document.getElementById("username").value;
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();
    console.log(data);
    displayUser(data)
  } catch (error) {
    console.log(error);
  }
  
}

function displayUser(data) {
  const biodata = document.getElementById('biodata');
  biodata.innerHTML = "";
  const avatarbox = document.getElementById('avatarbox')
  avatarbox.innerHTML = "";

  const avatar = document.createElement('div')
  avatar.className = 'avatar'

  const avatarImg = document.createElement('img');
  avatarImg.className = 'avatarImg'
  avatarImg.src = data.avatar_url;
  avatarImg.alt = 'avatar';

  const githubLink = document.createElement('a');
  githubLink.className = 'gitlink'
  githubLink.href = data.html_url;
  githubLink.target = "_blank";
  githubLink.textContent = '🔗' + data.html_url;

  const name = document.createElement('div')
  name.className = 'name'
  name.textContent = data.name;

  const bio = document.createElement('div')
  bio.className = 'bio'
  bio.textContent = data.bio;

  const location = document.createElement('div')
  location.className = 'location'
  location.textContent = data.location ? " Location:- " + data.location : " ";

  const twitter = document.createElement('div')
  twitter.className = 'twitter'
  twitter.textContent = data.twitter_username ? 'X' + data.twitter_username : " ";

avatar.appendChild(avatarImg)
avatarbox.appendChild(avatar)
avatarbox.appendChild(githubLink)

biodata.appendChild(name)
biodata.appendChild(bio)
biodata.appendChild(location)
biodata.appendChild(twitter)
}

async function getRepositories() {
  const username = document.getElementById("username").value;
  
  if (currentUser !== username) {
    currentUser = username;
    currentPage = 1;
  }
  const url = `https://api.github.com/users/${username}/repos?type=public&page=${currentPage}&per_page=${perPage}`;
  try {
    showLoader();
    const response = await fetch(url);
    const data = await response.json();
    const linkHeader = response.headers.get('Link');
        if (linkHeader) {
            const links = linkHeader.split(', ');

            for (const link of links) {
                const [urlPart, relPart] = link.split('; ');
                const urlMatch = urlPart.match(/<(.+)>/);
                const relMatch = relPart.match(/"(.+)"/);

                if (urlMatch && relMatch) {
                    const urlParams = new URLSearchParams(urlMatch[1]);
                    const rel = relMatch[1];

                    if (rel === 'last') {
                        totalRepos = parseInt(urlParams.get('page')) || 1;
                    }
                }
            }
        } else {
            const totalCountHeader = response.headers.get('total_count');
            totalRepos = totalCountHeader ? Math.ceil(parseInt(totalCountHeader) / perPage) : 1;
        }

    repositories=data;
    await fetchLanguages()
    displayRepositories();
    showPagination();
    
  } catch (error) {
    console.log("Error fetching data:", error);
  } finally {
    hideLoader();
  }
}

function displayRepositories(filteredRepos = repositories) {
  const repoList = document.getElementById("repoList");
  repoList.innerHTML = "";

  filteredRepos.forEach((repo) => {
    const repoCard = document.createElement("li");
    repoCard.className = "repoCard";

    const repoName = document.createElement("div");
    repoName.className = "repoName";
    repoName.textContent = repo.name;

    const repoDescription = document.createElement("div");
    repoDescription.className = "repoDescription";
    repoDescription.textContent =
    repo.description || "No description available";

    const repoLanguages = document.createElement("div");
        repoLanguages.className = "repoLanguages";

        repo.languages.forEach(language => {
            const languageElement = document.createElement("span");
            languageElement.className = "repoLanguage";
            languageElement.textContent = language;

            repoLanguages.appendChild(languageElement);
        });

    repoCard.appendChild(repoName);
    repoCard.appendChild(repoDescription);
    repoCard.appendChild(repoLanguages);
    repoList.appendChild(repoCard);
  });
}

async function fetchLanguages() {
  const languagePromises = repositories && repositories.map(async repo => {
      try {
          const languagesUrl = `https://api.github.com/repos/${repo.full_name}/languages`;
          const languagesResponse = await fetch(languagesUrl);

          if (!languagesResponse.ok) {
              throw new Error(`GitHub API Error: ${languagesResponse.status} ${languagesResponse.statusText}`);
          }

          const languagesData = await languagesResponse.json();
          repo.languages = Object.keys(languagesData);
      } catch (error) {
          console.error(`Error fetching languages for repo ${repo.full_name}:`, error);
      }
  });

  await Promise.all(languagePromises);
}

function showLoader() {
  document.getElementById("loader").style.display = "block";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

function showPagination() {
  document.getElementById("pagination").style.display = "block";
  const prevBtn = $("#prevBtn");
  const nextBtn = $("#nextBtn");
  const paginationContainer = $("#paginationNumbers");
  paginationContainer.empty(); // Clear previous pagination numbers

  const totalPagesToShow = Math.min(10, totalRepos); // Show up to 10 pages
    let startPage = Math.max(1, currentPage - Math.floor(totalPagesToShow / 2));
    let endPage = Math.min(startPage + totalPagesToShow - 1, totalRepos);

    if (endPage - startPage + 1 < totalPagesToShow) {
        startPage = Math.max(1, endPage - totalPagesToShow + 1);
    }
  

  for (let i = startPage; i <= endPage; i++) {
      const pageButton = $("<button>").text(i).on("click", function() {
          currentPage = i;
          getRepositories();
      }).toggleClass("activePage", i === currentPage);
      pageButton.addClass("smallbtn")
      paginationContainer.append(pageButton);
  }

  prevBtn.prop("disabled", currentPage === 1);
  nextBtn.prop("disabled", currentPage === totalRepos);
}


function filterRepositories() {
  const searchTerm = document.getElementById("search").value.toLowerCase();
  const filteredRepos = repositories.filter((repo) => {
    return (
      repo.name.toLowerCase().includes(searchTerm) ||
      (repo.description &&
        repo.description.toLowerCase().includes(searchTerm)) ||
      repo.languages.some((topic) => topic.toLowerCase().includes(searchTerm))
    );
  });

  displayRepositories(filteredRepos);
}
