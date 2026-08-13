type ScrollPosition = Pick<HTMLElement, 'clientHeight' | 'scrollHeight' | 'scrollTop'>

export function isNearChatBottom(position: ScrollPosition, threshold = 48) {
  return position.scrollHeight - position.scrollTop - position.clientHeight <= threshold
}
