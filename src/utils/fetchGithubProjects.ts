// src/utils/fetchGitHubFiles.ts
import { DataProps } from "../types/data";
import HookExtractor from "../module/HookExtractor";

interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch: string | null;
}

function parseGitHubUrl(url: string): GitHubRepoInfo | null {
  const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/);
  if (!match) return null;
  const [, owner, repo, branch] = match;
  return { owner, repo, branch: branch || 'main' };
}


async function limitConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index++;
      try {
        const result = await tasks[currentIndex]();
        results.push(result);
      } catch (err) {
        console.error("Task failed:", err);
      }
    }
  }

  // 병렬로 limit 개수만큼 worker 실행
  await Promise.all(Array.from({ length: limit }, () => worker()));

  return results;
}



export async function fetchGitHubFiles(
  githubUrl: string,
  hookExtractor: HookExtractor,
  onProgress?: (progress: { progress: number; total: number }) => void
): Promise<DataProps | null> {
  const repoInfo = parseGitHubUrl(githubUrl);
  if (!repoInfo) {
    alert("올바른 GitHub 주소가 아닙니다.");
    return null;
  }

  let { owner, repo, branch } = repoInfo;

  let treeRes = branch
    ? await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    ) : null

  if (!treeRes || !treeRes.ok) {
    const masterBranchRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`
    );
    if (masterBranchRes.ok) {
      treeRes = masterBranchRes;
      branch = "master";
    }
  }
  if (!treeRes || !treeRes.ok) {
    alert("레포의 파일 목록을 가져오는 데 실패했습니다.");
    return null;
  }
  const treeData = await treeRes.json();
  const tree = treeData.tree as Array<{ path: string; type: string }>;

  const codeFiles = tree.filter(
    (item) =>
      item.type === "blob" &&
      !item.path.includes("node_modules") &&
      (item.path.endsWith(".js") ||
        item.path.endsWith(".ts") ||
        item.path.endsWith(".jsx") ||
        item.path.endsWith(".tsx"))
  );

  console.log("treeData", treeData);
  console.log("tree", tree);
  console.log("codeFiles", codeFiles);


  if (onProgress) onProgress({ progress: 0, total: codeFiles.length })

  let completed = 0;

  const fetchTasks = codeFiles.map((file) => async () => {
    const res = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`
    );
    const content = await res.text();

    completed += 1;
    if (onProgress) onProgress({ progress: completed, total: codeFiles.length });

    return { filePath: file.path, content };
  });



  const fileContents = (await limitConcurrency(fetchTasks, 50)).filter(Boolean) as {
    filePath: string;
    content: string;
  }[];

  console.log("fileContents", fileContents);

  hookExtractor.setProject(fileContents);
  return JSON.parse(hookExtractor.toJson()) as DataProps;
}
