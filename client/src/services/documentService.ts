const API_URL = import.meta.env.VITE_API_URL

function getToken() {
    return localStorage.getItem("token")
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
    }
}

export async function getDocuments() {
    const response = await fetch(`${API_URL}/api/documents`, {
        method: "GET",
        headers: authHeaders(),
    })

    const result = await response.json()

    if (!result.success) {
        return []
    }

    return result.data
}

export async function renameDocument(documentName: string, document_id: number) {
    const response = await fetch(`${API_URL}/api/documents/${document_id}/rename`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
            documentName,
        }),
    })

    const result = await response.json()
    return result.success
}

export async function deleteDocument(document_id: number) {
    const response = await fetch(`${API_URL}/api/documents/${document_id}`, {
        method: "DELETE",
        headers: authHeaders(),
    })

    const result = await response.json()
    return result.success
}
