package websockets

func (m *Manager) FindFreeId() int { // finds the next free id, if no id available then returns 0
	var ids = []int{1, 2, 3, 4}
	for c := range m.clients {
		for index, id := range ids {
			if c.id == id {
				ids[index] = 0
				break
			}
		}
	}
	for _, id := range ids {
		if id > 0 {
			return id
		}
	}

	return 0
}

func remove(s []int, i int) []int {
	s[i] = s[len(s)-1]
	return s[:len(s)-1]
}

func find(s []int, el int) int {
	for index, value := range s {
		if value == el {
			return index
		}
	}
	return -1
}
