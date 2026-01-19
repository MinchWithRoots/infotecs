export async function fetchUsers({
  skip = 0,
  limit = 10,
  sortBy = null,
  order = null,
}) {
  let url = "https://dummyjson.com/users";
  const params = new URLSearchParams();

  if (limit !== null) params.append("limit", limit);
  if (skip !== null) params.append("skip", skip);
  if (sortBy) {
    params.append("sortBy", sortBy);
    params.append("order", order || "asc");
  }

  if (params.toString()) {
    url += "?" + params.toString();
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return await res.json();
}
