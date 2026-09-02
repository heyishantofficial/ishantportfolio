import { useState, useEffect, useCallback } from 'react';
import {
  subscribeFSEvents,
  registerCustomNode,
  renameNodeInTree,
  deleteNodeFromTree,
  findNode
} from '../data/ishantOS';

import { isYouTubeUrl, getYouTubeThumbnail, getYouTubeEmbedUrl } from './mediaHelpers';

export function useFileSystem() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    return subscribeFSEvents(() => {
      setVersion((v) => v + 1);
    });
  }, []);

  const addFolder = useCallback(async (parentId, folderName = 'untitled folder') => {
    const id = `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newFolder = {
      id,
      name: folderName,
      kind: 'folder',
      description: 'Folder',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      modifiedAt: 'Just now',
      children: [],
      isCustom: true,
      meta: {
        owner: 'Ishant (Admin)',
        size: '0 items'
      }
    };

    const ok = await registerCustomNode(parentId, newFolder);
    return ok ? newFolder : null;
  }, []);

  const addFile = useCallback(async (parentId, filePayload) => {
    const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newFile = {
      id,
      name: filePayload.name || 'untitled',
      kind: filePayload.kind || 'file',
      description: filePayload.description || 'Uploaded file',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      modifiedAt: 'Just now',
      isCustom: true,
      ...filePayload
    };

    const ok = await registerCustomNode(parentId, newFile);
    return ok ? newFile : null;
  }, []);

  const addWorkLink = useCallback(async (parentId, linkPayload) => {
    const id = `work-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const isYt = linkPayload.platform === 'youtube' || isYouTubeUrl(linkPayload.href);
    const ytThumb = isYt ? getYouTubeThumbnail(linkPayload.href) : null;
    const embedUrl = isYt ? getYouTubeEmbedUrl(linkPayload.href) : linkPayload.href;
    const thumbnail = linkPayload.thumbnailUrl || ytThumb || '';

    const newLinkNode = {
      id,
      name: linkPayload.name,
      kind: linkPayload.openMode === 'embed' && (isYt || linkPayload.platform === 'video') ? 'video' : 'link',
      description: linkPayload.description || (isYt ? 'YouTube Video' : 'Web Link'),
      href: linkPayload.href,
      videoUrl: embedUrl,
      platform: linkPayload.platform || (isYt ? 'youtube' : 'link'),
      thumbnailUrl: thumbnail,
      preview: thumbnail,
      openMode: linkPayload.openMode || 'embed',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      modifiedAt: 'Just now',
      isCustom: true,
      meta: {
        owner: 'Ishant (Admin)',
        target: linkPayload.href
      }
    };

    const ok = await registerCustomNode(parentId, newLinkNode);
    return ok ? newLinkNode : null;
  }, []);

  const renameNode = useCallback(async (nodeId, newName) => {
    if (!newName || !newName.trim()) return false;
    return await renameNodeInTree(nodeId, newName.trim());
  }, []);

  const deleteNode = useCallback(async (nodeId) => {
    return await deleteNodeFromTree(nodeId);
  }, []);

  return {
    version,
    addFolder,
    addFile,
    addWorkLink,
    renameNode,
    deleteNode,
    findNode
  };
}
